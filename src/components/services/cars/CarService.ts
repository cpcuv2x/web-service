import { consoleLogger, InfluxDB, QueryApi } from "@influxdata/influxdb-client";
import { Car, CarStatus, ModuleStatus, prisma, Prisma, PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import isFinite from "lodash/isFinite";
import winston from "winston";
import { ModuleRole } from "../../../enum/ModuleRole";
import { Configurations } from "../../commons/configurations/Configurations";
import { Utilities } from "../../commons/utilities/Utilities";
import { CarInformationOutput, Information, Location, Passengers, Status, TotalPassengersOutput } from "./interface";
import {
  CreateCarDto,
  GetCarAccidentLogsCriteria,
  GetPassengerInfluxQuery,
  SearchCarsCriteria,
  UpdateCarModel,
  UpdateModuleDTO,
} from "../../express-app/routes/cars/interfaces";

@injectable()
export class CarServices {
  private configurations: Configurations;
  private utilities: Utilities;
  private prismaClient: PrismaClient;
  private influxQueryApi: QueryApi;
  private logger: winston.Logger;

  private activeCar: number;
  private totalCar: number;

  private tempPassengers$: Map<string, Passengers>;
  private tempLocations$: Map<string, Location>;
  private tempStatus$: Map<string, Status>;
  private tempInformation$: Map<string, Information>;

  constructor(
    @inject(Configurations) configurations: Configurations,
    @inject(Utilities) utilities: Utilities,
    @inject("prisma-client") prismaClient: PrismaClient,
    @inject("influx-client") influxClient: InfluxDB,
  ) {
    this.configurations = configurations;
    this.utilities = utilities;
    this.prismaClient = prismaClient;
    this.influxQueryApi = influxClient.getQueryApi(
      this.configurations.getConfig().influx.org
    );

    this.logger = utilities.getLogger("car-service");
    this.logger.info("constructed.");

    this.tempPassengers$ = new Map<string, Passengers>();
    this.tempLocations$ = new Map<string, Location>();
    this.tempStatus$ = new Map<string, Status>();
    this.tempInformation$ = new Map<string, Information>();

    this.activeCar = 0;
    this.totalCar = 0;

    this.setUpTempLocation();
    this.setUpTempPassengers()
    this.setUpTempStatus();
    this.setUpInformation();
    this.setUpActiveCarAndTotalCar();
  }

  public getTempPassengers() {
    return this.tempPassengers$;
  }

  public getTempPassengersWithID(id: string) {
    return this.tempPassengers$.get(id);
  }

  public setTempPassengersWithID(id: string, passengers: Passengers) {
    return this.tempPassengers$.set(id, passengers);
  }

  public async setUpTempPassengers() {
    return await this.getCars({}).then(res => res.cars.forEach(element => {
      this.tempPassengers$.set(element.id, { passengers: element.passengers, timestamp: element.timestamp });
    }))
  }

  public getTempLocations() {
    return this.tempLocations$;
  }

  public getTempLocationsWithID(id: string) {
    return this.tempLocations$.get(id);
  }

  public setTempLocationsWithID(id: string, location: Location) {
    return this.tempLocations$.set(id, location);
  }

  public async setUpTempLocation() {
    return await this.getCars({}).then(res => res.cars.forEach(element => {
      this.tempLocations$.set(element.id, { lat: element.lat, lng: element.long, timestamp: element.timestamp })
    }))
  }

  public getTempStatus() {
    return this.tempStatus$;
  }

  public getTempStatusWithID(id: string) {
    return this.tempStatus$.get(id);
  }

  public setTempStatusWithID(id: string, status: Status) {
    return this.tempStatus$.set(id, status);
  }

  public async setUpTempStatus() {
    return await this.getCarsHeartbeat().then(res => res.forEach(element => {
      this.tempStatus$.set(element.id, { status: element.status, timestamp: element.timestamp });
    }))
  }

  public async setUpInformation() {
    return await this.getCars({}).then(res => res.cars.forEach(element => {
      this.tempInformation$.set(element.id, { licensePlate: element.licensePlate });
    }))
  }

  public async setUpActiveCarAndTotalCar() {
    const { active, total } = await this.getActiveCarsAndTotalCars();
    this.activeCar = active;
    this.totalCar = total;
    return { active, total }
  }

  public incrementActiveCar() {
    this.activeCar++;
  }

  public async updateInactiveCars(activeTimestamp: Date) {
    const inactiveCar = await this.prismaClient.car.updateMany({
      where: {
        timestamp: {
          lte: activeTimestamp
        },
      },
      data: {
        status: CarStatus.INACTIVE,
        passengers: 0
      }
    })
    this.activeCar = this.totalCar - inactiveCar.count
    return inactiveCar
  }

  public async updateInactiveModules(activeTimestamp: Date) {
    const inactiveMoudule = this.prismaClient.module.updateMany({
      where: {
        timestamp: {
          lte: activeTimestamp
        },
        status: ModuleStatus.ACTIVE
      },
      data: {
        status: ModuleStatus.INACTIVE
      }
    })
    return inactiveMoudule
  }

  public async updateLocations() {

    this.tempLocations$.forEach(({ lat, lng, timestamp }: Location, id: string) => {
      this.prismaClient.car.update({
        where: {
          id: id
        },
        data: {
          lat: lat,
          long: lng,
          timestamp: timestamp
        }
      })
    });
  }

  public async updateTempPassengers(activeTimestamp: Date) {
    const currentTimestamp = new Date();
    this.tempPassengers$.forEach(({ passengers, timestamp }: Passengers, id: string) => {
      if (timestamp != null && passengers != null) {
        const updateMessage = timestamp.getTime() >= activeTimestamp.getTime() ?
          {
            passengers: passengers!,
            timestamp
          } : {
            passengers: 0,
            timestamp: currentTimestamp
          };

        this.tempPassengers$.set(id, updateMessage);

        this.updateCar(id, { passengers, timestamp });
      }
    });
  }

  public async createCar(payload: CreateCarDto) {
    const car = this.prismaClient.$transaction(async (prisma) => {
      const car = await prisma.car.create({
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

      await prisma.module.create({
        data: {
          carId: car.id,
          role: ModuleRole.DROWSINESS_MODULE,
          status: CarStatus.INACTIVE
        },
        include: {
          car: true
        }
      })

      await prisma.module.create({
        data: {
          carId: car.id,
          role: ModuleRole.ACCIDENT_MODULE,
          status: CarStatus.INACTIVE
        },
        include: {
          car: true
        }
      })
      this.totalCar++;

      return car
    })
    return car;
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
        orderBy: {
          id: Prisma.SortOrder.asc
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

  public async getCarsLocation() {
    const locationOfCars = await this.prismaClient.car.findMany({
      select: {
        id: true,
        lat: true,
        long: true
      },
    });

    if (!locationOfCars) {
      throw new createHttpError.NotFound(`Cars was not found.`);
    }

    const output = locationOfCars.map(({ id: carId, lat, long: lng }) => ({ carId, lat, lng }));
    return output;
  }

  public getCarsPassengers() {

    let totalPassengers = 0;
    let passengersOfCars: TotalPassengersOutput[] = [];

    this.tempPassengers$.forEach((value: Passengers, id: string) => {
      if (this.tempStatus$.get(id)?.status === CarStatus.ACTIVE) {
        totalPassengers += value.passengers;
      }

      const status = this.tempStatus$.get(id)?.status;

      passengersOfCars.push({
        id,
        passengers: value.passengers,
        status: status != null ? status : CarStatus.INACTIVE
      });
    })

    const output = {
      totalPassengers,
      eachCarPassengers: passengersOfCars
    };

    return output;
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

  public async getCarsHeartbeat() {
    const selectionClauses = {
      select: {
        id: true,
        status: true,
        timestamp: true,
        Camera: {
          select: {
            role: true,
            status: true,
            timestamp: true
          },
          orderBy: {
            role: Prisma.SortOrder.asc
          }
        },
        Module: {
          select: {
            role: true,
            status: true,
            timestamp: true
          },
          orderBy: {
            role: Prisma.SortOrder.asc
          }
        }
      },
      orderBy: {
        id: Prisma.SortOrder.asc
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

  public async updateModule(id: string, role: ModuleRole, updateModuleDTO: UpdateModuleDTO) {
    const status = updateModuleDTO.status;
    const timestamp = updateModuleDTO.timestamp;

    const module = await this.prismaClient.module.findUnique({
      where: {
        carId_role: {
          carId: id,
          role: role
        }
      },
    });
    if (!module) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }
    try {
      const module = await this.prismaClient.module.update({
        where: {
          carId_role: {
            carId: id,
            role: role
          }
        },
        data: {
          status: status,
          timestamp: timestamp
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

    try {
      this.prismaClient.car.delete({ where: { id } });
      this.totalCar--;
      this.prismaClient.module.deleteMany({ where: { carId: id } });
    } catch (error) {
      throw new createHttpError.InternalServerError("Cannot delete car.");
    }

    return car;
  }

  public async getActiveCarsAndTotalCars() {
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

  public getTempActiveCarsAndTempTotalCars() {
    return {
      active: this.activeCar,
      total: this.totalCar
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
    let query = `from(bucket: "${this.configurations.getConfig().influx.bucket
      }") 
      |> range(start: ${payload.startTime}${payload.endTime ? " , stop: " + payload.endTime : ""
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
      let paddedResult: [Date, number][] = [];
      let actualResult: [Date, number][] = [];

      const startTime = new Date(payload.startTime as string),
        endTime = payload.endTime != "" ? new Date(payload.endTime as string) : new Date();

      startTime.setSeconds(0); startTime.setMilliseconds(0);
      endTime.setSeconds(0); endTime.setMilliseconds(0);

      const period = (endTime.getTime() - startTime.getTime()) / 60000 + 1;

      for (let i = 0; i < period; i++) {
        const emptyValue = [new Date(startTime), 0] as [Date, number];
        paddedResult.push(emptyValue);
        startTime.setMinutes(startTime.getMinutes() + 1);
      }

      let i = 0;
      this.influxQueryApi.queryRows(query, {
        next(row, tableMeta) {
          const rowObject = tableMeta.toObject(row);
          actualResult.push([rowObject._time, rowObject._value])
          rowObject._time = new Date(rowObject._time);
          rowObject._time.setSeconds(0)
          rowObject._time.setMilliseconds(0)

          while (i < period) {
            if (paddedResult[i][0].getTime() == rowObject._time.getTime()) {
              paddedResult[i] = [rowObject._time, rowObject._value]
              break
            }
            i++;
          }
        },
        error(error) {
          console.error(error);
          //console.log('Finished ERROR');
          reject(error);
        },
        complete() {
          //console.log('Finished SUCCESS');
          resolve(paddedResult);
        },
      });
    });
    return res;
  }

  public getInformationForOverviewPage(id: string): CarInformationOutput {
    const licensePlate = this.tempInformation$.get(id)?.licensePlate!;
    const passengers = this.tempPassengers$.get(id)?.passengers!;
    const status = this.tempStatus$.get(id)?.status!;

    return {
      id,
      licensePlate: licensePlate,
      passengers,
      status
    }
  }

}
