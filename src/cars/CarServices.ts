import { PrismaClient } from "@prisma/client";
import { CreateCarDto, UpdateCarDto } from "./interface";

interface CarServicesDependencies {
  prismaClient: PrismaClient;
}

export class CarServices {
  private dependencies: CarServicesDependencies;

  constructor(dependencies: CarServicesDependencies) {
    this.dependencies = dependencies;
  }

  public createCar(payload: CreateCarDto) {}

  public getAllCars() {}

  public getCarById(id: string) {}

  public updateCar(id: string, payload: UpdateCarDto) {}

  public deleteCar(id: string) {}
}
