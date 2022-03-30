import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";
import winston from "winston";
import { Utilities } from "../../commons/utilities/Utilities";
import { EventMessage } from "../../kafka-consumer/interfaces";

@injectable()
export class LogService {
  private utilities: Utilities;
  private prismaClient: PrismaClient;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject("prisma-client") prismaClient: PrismaClient
  ) {
    this.utilities = utilities;
    this.prismaClient = prismaClient;

    this.logger = this.utilities.getLogger("log-service");

    this.logger.info("constructed.");
  }

  public async createAccidentLog(message: EventMessage) {
    return this.prismaClient.accidentLog.create({
      data: {
        carId: message.carId,
        driverId: message.driverId,
        lat: message.lat ?? 0,
        long: message.lng ?? 0,
        timestamp: message.timestamp ?? new Date(),
      },
    });
  }
}
