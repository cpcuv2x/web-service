import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import createHttpError from "http-errors";
import { CreateCarModelDto, UpdateCarDto } from "./interface";

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

  public getAllCars() {}

  public getCarById(id: string) {}

  public updateCar(id: string, payload: UpdateCarDto) {}

  public deleteCar(id: string) {}
}
