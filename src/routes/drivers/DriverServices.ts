import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import createHttpError from "http-errors";
import isEmpty from "lodash/isEmpty";
import {
  CreateDriverModelDto,
  SearchDriversCriteria,
  UpdateDriverModelDto,
} from "./interfaces";

interface DriverServicesDependencies {
  prismaClient: PrismaClient;
}

export class DriverServices {
  private dependencies: DriverServicesDependencies;

  constructor(dependencies: DriverServicesDependencies) {
    this.dependencies = dependencies;
  }

  public async createDriver(payload: CreateDriverModelDto) {
    const { prismaClient } = this.dependencies;
    try {
      const driver = await prismaClient.driver.create({
        data: {
          ...payload,
        },
      });
      return driver;
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2002") {
        const clues = (prismaError.meta as any).target as any[];
        if (clues.find((clue) => clue === "nationalId")) {
          throw new createHttpError.BadRequest("National Id exists.");
        }
        else if (clues.find((clue) => clue === "carDrivingLicenseId")) {
          throw new createHttpError.BadRequest("Car driving license Id exists.");
        }
      }
      else {
        throw new createHttpError.InternalServerError(prismaError.message);
      }
    }
  }

  public async getDrivers(payload: SearchDriversCriteria) {
    const { prismaClient } = this.dependencies;

    const {
      firstName,
      lastName,
      nationalId,
      carDrivingLicenseId,
      imageFilename,
      startBirthDate,
      endBirthDate,
      limit,
      offset,
      orderBy,
      orderDir,
    } = payload;

    let firstNameWhereClause = {};
    if (!isEmpty(firstName)) {
      firstNameWhereClause = {
        firstName: {
          contains: firstName,
          mode: "insensitive",
        },
      };
    }

    let lastNameWhereClause = {};
    if (!isEmpty(lastName)) {
      lastNameWhereClause = {
        lastName: {
          contains: lastName,
          mode: "insensitive",
        },
      };
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
          { birthDate: { gte: new Date(startBirthDate!) } },
          { birthDate: { lte: new Date(endBirthDate!) } },
        ],
      };
    } else if (!isEmpty(startBirthDate)) {
      birthDateWhereClause = { birthDate: { gte: new Date(startBirthDate!) } };
    } else if (!isEmpty(endBirthDate)) {
      birthDateWhereClause = { birthDate: { lte: new Date(endBirthDate!) } };
    }

    const whereClauses = {
      ...firstNameWhereClause,
      ...lastNameWhereClause,
      ...nationalIdWhereClause,
      ...carDrivingLicenseIdWhereClause,
      ...imageFilenameWhereClause,
      ...birthDateWhereClause,
    };

    try {
      const drivers = await prismaClient.driver.findMany({
        where: whereClauses,
        skip: offset,
        take: limit,
        orderBy: { [orderBy]: orderDir },
      });
      const count = await prismaClient.driver.count({
        where: whereClauses,
      });
      return { drivers, count };
    } catch (error) {
      throw new createHttpError.BadRequest("Bad request.");
    }
  }

  public async getDriverById(id: string) {
    const { prismaClient } = this.dependencies;

    const driver = await prismaClient.driver.findUnique({
      where: {
        id,
      },
    });

    if (!driver) {
      throw new createHttpError.NotFound(`Driver was not found.`);
    }

    return driver;
  }

  public async updateDriver(id: string, payload: UpdateDriverModelDto) {
    const { prismaClient } = this.dependencies;

    const driver = await prismaClient.driver.findUnique({
      where: {
        id,
      },
    });

    if (!driver) {
      throw new createHttpError.NotFound(`Driver was not found.`);
    }

    try {
      const driver = await prismaClient.driver.update({
        where: {
          id,
        },
        data: {
          ...payload,
        },
      });
      return driver;
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2002") {
        const clues = (prismaError.meta as any).target as any[];
        if (clues.find((clue) => clue === "nationalId")) {
          throw new createHttpError.BadRequest("National Id exists.");
        }
        else if (clues.find((clue) => clue === "carDrivingLicenseId")) {
          throw new createHttpError.BadRequest("Car driving license Id exists.");
        }
      }
      else {
        throw new createHttpError.InternalServerError(prismaError.message);
      }
    }

    return driver;
  }

  public async deleteDriver(id: string) {
    const { prismaClient } = this.dependencies;

    const driver = await prismaClient.driver.findUnique({
      where: {
        id,
      },
    });

    if (!driver) {
      throw new createHttpError.NotFound(`Driver was not found.`);
    }

    return prismaClient.driver.delete({ where: { id } });
  }
}
