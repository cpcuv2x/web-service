import { InfluxDB, QueryApi } from "@influxdata/influxdb-client";
import { CarStatus, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import createHttpError from "http-errors";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import isFinite from "lodash/isFinite";
import winston from "winston";
import { Utilities } from "../../commons/utilities/Utilities";
import {
  CreateCarModelDto,
  GetCarAccidentLogsCriteria,
  GetPassengerInfluxQuery,
  SearchCarsCriteria,
  UpdateCarModelDto
} from "../../express-app/routes/cars/interfaces";

@injectable()
export class CarServices {
  private utilities: Utilities;
  private prismaClient: PrismaClient;
  private influxQueryApi: QueryApi;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject("prisma-client") prismaClient: PrismaClient,
    @inject("influx-client") influxClient: InfluxDB
  ) {
    this.utilities = utilities;
    this.prismaClient = prismaClient;
    this.influxQueryApi = influxClient.getQueryApi("my-org");

    this.logger = utilities.getLogger("car-service");

    this.logger.info("constructed.");
  }

  public async createCar(payload: CreateCarModelDto) {
    try {
      const car = await this.prismaClient.car.create({
        data: {
          ...payload,
          status: CarStatus.INACTIVE,
          passengers: 0,
          lat: 0,
          long: 0,
        },
      });
      return car;
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2002") {
        const clues = (prismaError.meta as any).target as any[];
        if (clues.find((clue) => clue === "licensePlate")) {
          throw new createHttpError.BadRequest("License plate exists.");
        }
      }
    }
  }

  public async getCars(payload: SearchCarsCriteria) {
    const {
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
      });
      const count = await this.prismaClient.car.count({
        where: whereClauses,
      });
      return { cars, count };
    } catch (error) {
      throw new createHttpError.BadRequest("Bad request.");
    }
  }

  public async getCarById(id: string) {
    const car = await this.prismaClient.car.findUnique({
      where: {
        id,
      },
    });

    if (!car) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }

    return car;
  }

  public async updateCar(id: string, payload: UpdateCarModelDto) {
    const car = await this.prismaClient.car.findUnique({
      where: {
        id,
      },
    });

    if (!car) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }

    try {
      const car = await this.prismaClient.car.update({
        where: {
          id,
        },
        data: {
          ...payload,
        },
      });
      return car;
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2002") {
        const clues = (prismaError.meta as any).target as any[];
        if (clues.find((clue) => clue === "licensePlate")) {
          throw new createHttpError.BadRequest("License plate exists.");
        }
      }
    }

    return car;
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
  
  public async getPassengersInflux(id: string, payload: GetPassengerInfluxQuery) {
    let query = `from(bucket: "my-bucket") 
      |> range(start: ${payload.startTime}${payload.endTime ? " , stop: " + payload.endTime : ""}) 
      |> filter(fn: (r) => r["_measurement"] == "passenger" and r["car_id"] == "${id}" and r["_field"] == "passenger")`;
    if (payload.aggregate) {
      query += `\n      |> aggregateWindow(every: 1h, fn: mean)`
    }
    console.log(query);
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
}
