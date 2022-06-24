import { InfluxDB, QueryApi } from "@influxdata/influxdb-client";
import { CarStatus, ModuleStatus, Prisma, PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import isFinite from "lodash/isFinite";
import winston from "winston";
import { ModuleRole } from "../../../enum/ModuleRole";
import { Status } from "../../../enum/Status";
import { Configurations } from "../../commons/configurations/Configurations";
import { Utilities } from "../../commons/utilities/Utilities";
import {
  CreateCarDto,
  GetCarAccidentLogsCriteria,
  GetPassengerInfluxQuery,
  SearchCarsCriteria,
  UpdateCarModel,
  UpdateModuleDTO,
} from "../../express-app/routes/cars/interfaces";
import { CronJob } from "cron";

@injectable()
export class CarServices {
  private configurations: Configurations;
  private utilities: Utilities;
  private prismaClient: PrismaClient;
  private influxQueryApi: QueryApi;

  private logger: winston.Logger;
  private carCronJob: CronJob;

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

    this.logger = utilities.getLogger("car-service");

    this.logger.info("constructed.");

    this.carCronJob = new CronJob('0 * * * * *', async () => {

      const date = new Date();
      date.setSeconds(date.getSeconds()-80);

      const inactiveCar = await this.prismaClient.car.updateMany({
        where: {
          timestamp: {
            lte: date
          },
          status: CarStatus.ACTIVE
        },
        data: {
          status : CarStatus.INACTIVE
        }
      })

      const inactiveMoudule = await this.prismaClient.module.updateMany({
        where: {
          timestamp: {
            lte: date
          },
          status: ModuleStatus.ACTIVE
        },
        data: {
          status : ModuleStatus.INACTIVE
        }
      })

    })

    if (!this.carCronJob.running) {
      this.carCronJob.start();
    }
  }

  public async createCar(payload: CreateCarDto) {
    try {
      const car = await this.prismaClient.car.create({
        data: {
          model: payload.model,
          licensePlate: payload.licensePlate,
          imageFilename: "",
          status: CarStatus.INACTIVE,
          passengers: 0,
          lat: 0,
          long: 0,
          Camera: {
            connect: payload.cameras,
          }
        },
        include: {
          Camera: true,
          Driver: true,
        },
      });
      
      await  this.prismaClient.module.create({
        data:{
          carId : car.id,
          role : ModuleRole.DROWSINESS_MODULE,
          status : Status.INACTIVE
        },
        include:{
          car: true
        }
      })

      await  this.prismaClient.module.create({
        data:{
          carId : car.id,
          role : ModuleRole.ACCIDENT_MODULE,
          status : Status.INACTIVE
        },
        include:{
          car: true
        }
      })

      return car;
    } catch (error) {
      throw new createHttpError.InternalServerError("Cannot create car.");
    }
  }

  public async getCars(payload: SearchCarsCriteria) {
    const {
      id,
      licensePlate,
      model,
      imageFilename,
      status,
      minPassengers,
      maxPassengers,
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

    let licensePlateWhereClause = {};
    if (!isEmpty(licensePlate)) {
      licensePlateWhereClause = {
        licensePlate: {
          contains: licensePlate,
          mode: "insensitive",
        },
      };
    }

    let modelWhereClause = {};
    if (!isEmpty(model)) {
      modelWhereClause = {
        model: {
          contains: model,
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

    let statusWhereClause = {};
    if (!isEmpty(status)) {
      statusWhereClause = { status };
    }

    let passengersWhereClause = {};
    if (isFinite(minPassengers) && isFinite(maxPassengers)) {
      passengersWhereClause = {
        AND: [
          { passengers: { gte: minPassengers } },
          { passengers: { lte: maxPassengers } },
        ],
      };
    } else if (isFinite(minPassengers)) {
      passengersWhereClause = { passengers: { gte: minPassengers } };
    } else if (isFinite(maxPassengers)) {
      passengersWhereClause = { passengers: { lte: maxPassengers } };
    }

    const whereClauses = {
      ...idWhereClause,
      ...licensePlateWhereClause,
      ...modelWhereClause,
      ...statusWhereClause,
      ...imageFilenameWhereClause,
      ...passengersWhereClause,
    };

    let skipClause = {};
    if (isFinite(offset)) {
      skipClause = { skip: offset };
    }

    let takeClause = {};
    if (isFinite(limit)) {
      takeClause = { take: limit };
    }

    let orderByClause = {};
    if (!isEmpty(orderBy) && !isEmpty(orderDir)) {
      orderByClause = { orderBy: { [orderBy!]: orderDir } };
    }

    try {
      const cars = await this.prismaClient.car.findMany({
        where: whereClauses,
        ...skipClause,
        ...takeClause,
        ...orderByClause,
        include: {
          Camera: true,
          Driver: true,
          Module: true
        },
        orderBy : {
          id : Prisma.SortOrder.asc
        }
      });
      const count = await this.prismaClient.car.count({
        where: whereClauses,
      });
      return { cars, count };
    } catch (error) {
      throw new createHttpError.InternalServerError(
        "Cannot get a list of cars."
      );
    }
  }

  public async getCarById(id: string) {
    const car = await this.prismaClient.car.findUnique({
      where: {
        id,
      },
      include: {
        Camera: true,
        Driver: true,
        Module: true
      },
    });

    if (!car) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }

    return car;
  }

  public async getCarsHeartbeat(){
    const selectionClauses = {
      select:{
        id: true,
        status: true,
        timestamp: true,
        Camera : { 
          select : {
            role : true,
            status : true,
            timestamp : true
          },
          orderBy : {
            role : Prisma.SortOrder.asc
          }
        },
        Module : {
          select : {
            role : true,
            status : true,
            timestamp : true
          },
          orderBy : {
            role : Prisma.SortOrder.asc
          }
        }
      },
      orderBy:{
        id : Prisma.SortOrder.asc
      }
    }
    try { 
      const cars = await this.prismaClient.car.findMany(selectionClauses);
      return cars;
    }
    catch (error) {
      throw new createHttpError.InternalServerError(
        "Cannot get a list of cars."
      );
    }
  }

  public async updateCar(id: string, payload: UpdateCarModel) {
    const car = await this.prismaClient.car.findUnique({
      where: {
        id,
      },
    });

    if (!car) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }

    const { cameras, ...rest } = payload;

    try {
      const car = await this.prismaClient.car.update({
        where: { id },
        data: {
          ...rest,
          Camera: cameras,
        },
        include: {
          Camera: true,
          Driver: true,
          Module: true
        },
      });
      return car;
    } catch (error) {
      throw new createHttpError.InternalServerError("Cannot update car.");
    }
  }

  public async updateModule(id: string, role : ModuleRole, updateModuleDTO: UpdateModuleDTO){
    const status = updateModuleDTO.status;
    const timestamp = updateModuleDTO.timestamp;

    const module = await this.prismaClient.module.findUnique({
      where: {
        carId_role:{
          carId : id,
          role : role
        }
      },
    });
    if (!module) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }
    try{
      const module = await this.prismaClient.module.update({
        where: { 
          carId_role:{
            carId : id,
            role :  role
          }
        },
        data: {
          status : status,
          timestamp : timestamp
        },
        include: {
          car: true,
        },
      });
      return module;
    } catch (error) {
      throw new createHttpError.InternalServerError("Cannot update drowsiness module.");  
    }
  }

  public async deleteCar(id: string) {
    const car = await this.prismaClient.car.findUnique({
      where: {
        id,
      },
    });

    if (!car) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }

    return this.prismaClient.car.delete({ where: { id } });
  }

  public async getActiveCars() {
    const totalCount = await this.prismaClient.car.aggregate({
      _count: {
        _all: true,
      },
    });
    const activeCount = await this.prismaClient.car.aggregate({
      _count: {
        _all: true,
      },
      where: {
        status: CarStatus.ACTIVE,
      },
    });

    return {
      active: activeCount._count._all,
      total: totalCount._count._all,
    };
  }

  public async getTotalPassengers() {
    const result = await this.prismaClient.car.aggregate({
      _sum: {
        passengers: true,
      },
      where: {
        status: CarStatus.ACTIVE,
      },
    });

    return result._sum.passengers;
  }

  public async getCarAccidentLogs(payload: GetCarAccidentLogsCriteria) {
    return this.prismaClient.accidentLog.findMany({
      where: {
        carId: payload.carId,
        AND: [
          { timestamp: { gte: payload.startTime } },
          { timestamp: { lte: payload.endTime } },
        ],
      },
    });
  }

  public async getPassengersInflux(
    id: string,
    payload: GetPassengerInfluxQuery
  ) {
    let query = `from(bucket: "${
      this.configurations.getConfig().influx.bucket
    }") 
      |> range(start: ${payload.startTime}${
      payload.endTime ? " , stop: " + payload.endTime : ""
    }) 
      |> filter(fn: (r) => r["_measurement"] == "car_passenger" and r["car_id"] == "${id}" and r["_field"] == "passenger")`;
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
}
