import { NotificationType, PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";
import winston from "winston";
import { Utilities } from "../../commons/utilities/Utilities";
import { EventMessageType } from "../../kafka-consumer/enums";
import { EventMessage } from "../../kafka-consumer/interfaces";
@injectable()
export class NotificiationServices {
  private utilities: Utilities;
  private prismaClient: PrismaClient;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject("prisma-client") prismaClient: PrismaClient
  ) {
    this.utilities = utilities;
    this.prismaClient = prismaClient;

    this.logger = this.utilities.getLogger("notification-services");

    this.logger.info("constructed.");
  }

  public async createAccidentNotificationFromEventMessage(
    message: EventMessage
  ) {
    if (message.type !== EventMessageType.Accident) {
      throw new Error("Event message type is not accident.");
    }
    const users = await this.prismaClient.user.findMany();
    const notification = await this.prismaClient.notification.create({
      data: {
        type: NotificationType.ACCIDENT,
        message: `Car ${message.carId}: Accident occured`,
        timestamp: new Date(),
        jsonMetadata: JSON.stringify({
          carId: message.carId,
        }),
        NotificationAcknowledgement: {
          create: users.map((user) => ({
            userId: user.id,
            read: false,
          })),
        },
      },
    });
    return notification;
  }

  public async createDrowsinessNotificationFromEventMessage(
    message: EventMessage
  ) {
    if (message.type !== EventMessageType.Drowsiness) {
      throw new Error("Event message type is not drowsiness.");
    }
    const users = await this.prismaClient.user.findMany();
    const notification = await this.prismaClient.notification.create({
      data: {
        type: NotificationType.DROWSINESS,
        message: `Driver ${message.driverId}: Drowsiness detected`,
        timestamp: new Date(message.time!),
        jsonMetadata: JSON.stringify({
          carId: message.carId,
        }),
        NotificationAcknowledgement: {
          create: users.map((user) => ({
            userId: user.id,
            read: false,
          })),
        },
      },
    });
    return notification;
  }
}
