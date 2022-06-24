import { InfluxDB, QueryApi } from "@influxdata/influxdb-client";
import { DriverStatus, PrismaClient, UserRole } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import createHttpError from "http-errors";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import winston from "winston";
import { Configurations } from "../../commons/configurations/Configurations";
import { Utilities } from "../../commons/utilities/Utilities";
import {
  CreateDriverModelDto,
  GetDriverAccidentLogsCriteria,
  GetDriverDrowsinessAlarmLogsCriteria,
  GetDrowsinessInfluxQuery,
  GetECRInfluxQuery,
  SearchDriversCriteria,
  UpdateDriverModelDto,
} from "../../express-app/routes/drivers/interfaces";
import * as bcrypt from "bcrypt";
import { CronJob } from "cron";
 
@injectable()
export class DriverService {
  private configurations: Configurations;
  private utilities: Utilities;
  private prismaClient: PrismaClient;
  private influxQueryApi: QueryApi;

  private logger: winston.Logger;
  private driverCronJob: CronJob;

  constructor(
    @inject(Configurations) configurations: Configurations,
    @inject(Utilities) utilities: Utilities,
    @inject("prisma-client") prismaClient: PrismaClient,
    @inject("influx-client") influxClient: InfluxDB
  ) {
    this.configurations = configurations;
    this.utilities = utilities;
    this.prismaClient = prismaClient;
    this.influxQueryApi = influxClient.getQueryApi(
      this.configurations.getConfig().influx.org
    );

    this.logger = utilities.getLogger("driver-service");

    this.logger.info("constructed.");

    this.driverCronJob = new CronJob('0 * * * * *', async () => {

      const date = new Date();
      date.setSeconds(date.getSeconds()-80);

      const inactiveDriver = await this.prismaClient.driver.updateMany({
        where: {
          timestamp: {
            lte: date
          },
          status: DriverStatus.ACTIVE
        },
        data: {
          status : DriverStatus.INACTIVE
        }
      })

    })

    if (!this.driverCronJob.running) {
      this.driverCronJob.start();
    }
  }

  public async createDriver(payload: CreateDriverModelDto, username : string, password : string) {
    try {
      let driver;

      await this.prismaClient.$transaction( async (prisma) => {

        const existingUser = await prisma.user.findUnique({
          where: {
            username,
          },
        });
        if (existingUser) {
          throw new createHttpError.BadRequest("Username has already been used.");
        }
    
        const saltRound = 10;
        const hash = await bcrypt.hash(password, saltRound);
        const user = await prisma.user.create({
          data: {
            username,
            password: hash,
            role : UserRole.DRIVER,
          },
        });

        const driverPayload = { ...payload, userId: user.id };
        driver = await prisma.driver.create({
          data: {
            ...driverPayload,
            registerDate: new Date(),
            status: DriverStatus.INACTIVE,
            imageFilename: "",
          },
          include: {
            User: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
            Car: true,
          },
        });
      })

      return driver;
      
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2002") {
        const clues = (prismaError.meta as any).target as any[];
        if (clues.find((clue) => clue === "nationalId")) {
          throw new createHttpError.BadRequest("National Id exists.");
        } else if (clues.find((clue) => clue === "carDrivingLicenseId")) {
          throw new createHttpError.BadRequest(
            "Car driving license Id exists."
          );
        }
      } else {
        throw new createHttpError.InternalServerError("Cannot create driver.");
      }
    }
  }

  public async getDrivers(payload: SearchDriversCriteria) {
    const {
      id,
      firstNameTH,
      lastNameTH,
      firstNameEN,
      lastNameEN,
      gender,
      nationalId,
      carDrivingLicenseId,
      imageFilename,
      startBirthDate,
      endBirthDate,
      startRegisterDate,
      endRegisterDate,
      status,
      limit,
      offset,
      orderBy,
      orderDir,
    } = payload;

    let idWhereClause = {};
    if (!isEmpty(id)) {
      idWhereClause = {
        id: {
          contains: id,
          mode: "insensitive",
        },
      };
    }

    let firstNameTHWhereClause = {};
    if (!isEmpty(firstNameTH)) {
      firstNameTHWhereClause = {
        firstNameTH: {
          contains: firstNameTH,
          mode: "insensitive",
        },
      };
    }

    let lastNameTHWhereClause = {};
    if (!isEmpty(lastNameTH)) {
      lastNameTHWhereClause = {
        lastNameTH: {
          contains: lastNameTH,
          mode: "insensitive",
        },
      };
    }

    let firstNameENWhereClause = {};
    if (!isEmpty(firstNameEN)) {
      firstNameENWhereClause = {
        firstNameEN: {
          contains: firstNameEN,
          mode: "insensitive",
        },
      };
    }

    let lastNameENWhereClause = {};
    if (!isEmpty(lastNameEN)) {
      lastNameENWhereClause = {
        lastNameEN: {
          contains: lastNameEN,
          mode: "insensitive",
        },
      };
    }

    let genderWhereClause = {};
    if (!isEmpty(gender)) {
      genderWhereClause = { gender };
    }

    let nationalIdWhereClause = {};
    if (!isEmpty(nationalId)) {
      nationalIdWhereClause = {
        nationalId: {
          contains: nationalId,
          mode: "insensitive",
        },
      };
    }

    let carDrivingLicenseIdWhereClause = {};
    if (!isEmpty(carDrivingLicenseId)) {
      carDrivingLicenseIdWhereClause = {
        carDrivingLicenseId: {
          contains: carDrivingLicenseId,
          mode: "insensitive",
        },
      };
    }

    let imageFilenameWhereClause = {};
    if (!isEmpty(imageFilename)) {
      imageFilenameWhereClause = {
        imageFilename: {
          contains: imageFilename,
          mode: "insensitive",
        },
      };
    }

    let birthDateWhereClause = {};
    if (!isEmpty(startBirthDate) && !isEmpty(endBirthDate)) {
      birthDateWhereClause = {
        AND: [
          { birthDate: { gte: startBirthDate } },
          { birthDate: { lte: endBirthDate } },
        ],
      };
    } else if (!isEmpty(startBirthDate)) {
      birthDateWhereClause = { birthDate: { gte: startBirthDate } };
    } else if (!isEmpty(endBirthDate)) {
      birthDateWhereClause = { birthDate: { lte: endBirthDate } };
    }

    let registerDateWhereClause = {};
    if (!isEmpty(startRegisterDate) && !isEmpty(endRegisterDate)) {
      registerDateWhereClause = {
        AND: [
          { registerDate: { gte: startRegisterDate } },
          { registerDate: { lte: endRegisterDate } },
        ],
      };
    } else if (!isEmpty(startRegisterDate)) {
      registerDateWhereClause = { registerDate: { gte: startRegisterDate } };
    } else if (!isEmpty(endRegisterDate)) {
      registerDateWhereClause = { registerDate: { lte: endRegisterDate } };
    }

    let statusWhereClause = {};
    if (!isEmpty(status)) {
      statusWhereClause = { status };
    }

    const whereClauses = {
      ...idWhereClause,
      ...firstNameTHWhereClause,
      ...lastNameTHWhereClause,
      ...firstNameENWhereClause,
      ...lastNameENWhereClause,
      ...genderWhereClause,
      ...nationalIdWhereClause,
      ...carDrivingLicenseIdWhereClause,
      ...imageFilenameWhereClause,
      ...birthDateWhereClause,
      ...registerDateWhereClause,
      ...statusWhereClause,
    };

    let skipClause = {};
    if (isFinite(offset!)) {
      skipClause = { skip: offset };
    }

    let takeClause = {};
    if (isFinite(limit!)) {
      takeClause = { take: limit };
    }

    let orderByClause = {};
    if (!isEmpty(orderBy) && !isEmpty(orderDir)) {
      orderByClause = { orderBy: { [orderBy!]: orderDir } };
    }

    try {
      const drivers = await this.prismaClient.driver.findMany({
        where: whereClauses,
        ...skipClause,
        ...takeClause,
        ...orderByClause,
        include: {
          User: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          Car: true,
        },
      });
      const count = await this.prismaClient.driver.count({
        where: whereClauses,
      });
      return { drivers, count };
    } catch (error) {
      throw new createHttpError.BadRequest("Bad request.");
    }
  }

  public async getDriverById(id: string) {
    const driver = await this.prismaClient.driver.findUnique({
      where: {
        id,
      },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        Car: true,
      },
    });

    if (!driver) {
      throw new createHttpError.NotFound(`Driver was not found.`);
    }

    return driver;
  }

  public async updateDriver(id: string, payload: UpdateDriverModelDto) {
    const driver = await this.prismaClient.driver.findUnique({
      where: {
        id,
      },
    });

    if (!driver) {
      throw new createHttpError.NotFound(`Driver was not found.`);
    }

    try {
      const driver = await this.prismaClient.driver.update({
        where: {
          id,
        },
        data: {
          ...payload,
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          Car: true,
        },
      });
      return driver;
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2002") {
        const clues = (prismaError.meta as any).target as any[];
        if (clues.find((clue) => clue === "nationalId")) {
          throw new createHttpError.BadRequest("National Id exists.");
        } else if (clues.find((clue) => clue === "carDrivingLicenseId")) {
          throw new createHttpError.BadRequest(
            "Car driving license Id exists."
          );
        }
      } else {
        throw new createHttpError.InternalServerError("Cannot update driver.");
      }
    }

    return driver;
  }

  public async deleteDriver(id: string) {
    const driver = await this.prismaClient.driver.findUnique({
      where: {
        id,
      },
    });

    if (!driver) {
      throw new createHttpError.NotFound(`Driver was not found.`);
    }

    return this.prismaClient.driver.delete({ where: { id } });
  }

  public async getActiveDrivers() {
    const totalCount = await this.prismaClient.driver.aggregate({
      _count: {
        _all: true,
      },
    });
    const activeCount = await this.prismaClient.driver.aggregate({
      _count: {
        _all: true,
      },
      where: {
        status: DriverStatus.ACTIVE,
      },
    });

    return {
      active: activeCount._count._all,
      total: totalCount._count._all,
    };
  }

  public async getDriverAccidentLogs(payload: GetDriverAccidentLogsCriteria) {
    return this.prismaClient.accidentLog.findMany({
      where: {
        driverId: payload.driverId,
        AND: [
          { timestamp: { gte: payload.startTime } },
          { timestamp: { lte: payload.endTime } },
        ],
      },
      include: {
        Car: true,
        Driver: true,
      },
    });
  }

  public async getECRInflux(id: string, payload: GetECRInfluxQuery) {
    let query = `from(bucket: "${
      this.configurations.getConfig().influx.bucket
    }") 
      |> range(start: ${payload.startTime}${
      payload.endTime ? ", stop: " + payload.endTime : ""
    }) 
      |> filter(fn: (r) => r["_measurement"] == "driver_ecr" and r["driver_id"] == "${id}" and r["_field"] == "ecr")`;
    if (payload.carId) {
      query += `\n      |> filter(fn: (r) => r["car_id"] == "${payload.carId}")`;
    }
    if (payload.aggregate) {
      query += `\n      |> window(every: 1h)
      |> mean()
      |> duplicate(column: "_start", as: "window_start")
      |> duplicate(column: "_stop", as: "_time")
      |> window(every: inf)`;
    }
    //console.log(query);
    const res = await new Promise((resolve, reject) => {
      let result: any[] = [];
      this.influxQueryApi.queryRows(query, {
        next(row, tableMeta) {
          const rowObject = tableMeta.toObject(row);
          //console.log(rowObject);
          result.push([rowObject._time, rowObject._value]);
        },
        error(error) {
          console.error(error);
          //console.log('Finished ERROR');
          reject(error);
        },
        complete() {
          //console.log('Finished SUCCESS');
          resolve(result);
        },
      });
    });
    return res;
  }

  /**
   * @deprecated
   */
  public async getDrowsinessInflux(
    driverId: string,
    payload: GetDrowsinessInfluxQuery
  ) {
    let query = `from(bucket: "${
      this.configurations.getConfig().influx.bucket
    }") 
      |> range(start: ${payload.startTime}${
      payload.endTime ? " , stop: " + payload.endTime : ""
    }) 
      |> filter(fn: (r) => r["_measurement"] == "drowsiness" and r["driver_id"] == "${driverId}" and r["_field"] == "response_time")`;
    if (payload.aggregate) {
      query += `\n      |> aggregateWindow(every: 1h, fn: mean)`;
    }
    //console.log(query);
    const res = await new Promise((resolve, reject) => {
      let result: any[] = [];
      this.influxQueryApi.queryRows(query, {
        next(row, tableMeta) {
          const rowObject = tableMeta.toObject(row);
          //console.log(rowObject);
          result.push(rowObject);
        },
        error(error) {
          console.error(error);
          //console.log('Finished ERROR');
          reject(error);
        },
        complete() {
          //console.log('Finished SUCCESS');
          resolve(result);
        },
      });
    });
    return res;
  }

  public async getDriverDrowsinessAlarmLogs(
    payload: GetDriverDrowsinessAlarmLogsCriteria
  ) {
    return this.prismaClient.drowsinessAlarmLog.findMany({
      where: {
        driverId: payload.driverId,
        AND: [
          { timestamp: { gte: payload.startTime } },
          { timestamp: { lte: payload.endTime } },
        ],
      },
      include: {
        Car: true,
        Driver: true,
      },
    });
  }
}
