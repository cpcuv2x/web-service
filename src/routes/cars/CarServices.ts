import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import createHttpError from "http-errors";
import isEmpty from "lodash/isEmpty";
import isFinite from "lodash/isFinite";
import {
  CreateCarModelDto,
  SearchCarsCriteria,
  UpdateCarDto,
} from "./interfaces";

interface CarServicesDependencies {
  prismaClient: PrismaClient;
}

export class CarServices {
  private dependencies: CarServicesDependencies;

  constructor(dependencies: CarServicesDependencies) {
    this.dependencies = dependencies;
  }

  public async createCar(payload: CreateCarModelDto) {
    const { prismaClient } = this.dependencies;
    try {
      const car = await prismaClient.car.create({
        data: {
          ...payload,
          status: "INACTIVE",
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
    const { prismaClient } = this.dependencies;

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

    try {
      const cars = await prismaClient.car.findMany({
        where: whereClauses,
        skip: offset,
        take: limit,
        orderBy: { [orderBy]: orderDir },
      });
      const count = await prismaClient.car.count({
        where: whereClauses,
      });
      return { cars, count };
    } catch (error) {
      throw new createHttpError.BadRequest("Bad request.");
    }
  }

  public async getCarById(id: string) {
    const { prismaClient } = this.dependencies;

    const car = await prismaClient.car.findUnique({
      where: {
        id,
      },
    });

    if (!car) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }

    return car;
  }

  public async updateCar(id: string, payload: UpdateCarDto) {
    const { prismaClient } = this.dependencies;

    const car = await prismaClient.car.findUnique({
      where: {
        id,
      },
    });

    if (!car) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }

    try {
      const car = await prismaClient.car.update({
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
    const { prismaClient } = this.dependencies;

    const car = await prismaClient.car.findUnique({
      where: {
        id,
      },
    });

    if (!car) {
      throw new createHttpError.NotFound(`Car was not found.`);
    }

    return prismaClient.car.delete({ where: { id } });
  }
}
