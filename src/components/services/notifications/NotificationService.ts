import { NotificationType, PrismaClient, UserRole } from "@prisma/client";
import createHttpError from "http-errors";
import { inject, injectable } from "inversify";
import winston from "winston";
import { Utilities } from "../../commons/utilities/Utilities";
import { MessageKind, MessageType } from "../../kafka-consumer/enums";
import { Message } from "../../kafka-consumer/interfaces";

@injectable()
export class NotificiationService {
  private utilities: Utilities;
  private prismaClient: PrismaClient;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject("prisma-client") prismaClient: PrismaClient
  ) {
    this.utilities = utilities;
    this.prismaClient = prismaClient;

    this.logger = this.utilities.getLogger("notification-service");

    this.logger.info("constructed.");
  }

  public async createAccidentNotification(message: Message) {
    if (message.type !== MessageType.Event) {
      throw new Error("Message type is not an event.");
    }
    if (message.kind !== MessageKind.Accident) {
      throw new Error("Message kind is not an accident.");
    }
    const users = await this.prismaClient.user.findMany({
      where: { role: UserRole.ADMIN },
    });
    const notification = await this.prismaClient.notification.create({
      data: {
        type: NotificationType.ACCIDENT,
        message: `Car ${message.carId}: Accident occured`,
        timestamp: message.timestamp ?? new Date(),
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

  public async createDrowsinessNotification(message: Message) {
    if (message.type !== MessageType.Event) {
      throw new Error("Message type is not an event.");
    }
    if (message.kind !== MessageKind.DrowsinessAlarm) {
      throw new Error("Message kind is not a drowsiness alarm.");
    }
    const users = await this.prismaClient.user.findMany({
      where: { role: UserRole.ADMIN },
    });
    const notification = await this.prismaClient.notification.create({
      data: {
        type: NotificationType.DROWSINESS,
        message: `Driver ${message.driverId}: Drowsiness detected`,
        timestamp: message.timestamp ?? new Date(),
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

  public async getUserNotifications(userId: string) {
    return this.prismaClient.notificationRead.findMany({
      where: {
        userId,
      },
      include: {
        Notification: true,
      },
    });
  }

  public async markUserNotificationAsRead(userNotificationId: string) {
    try {
      const userNotification = await this.prismaClient.notificationRead.update({
        where: {
          id: userNotificationId,
        },
        data: {
          read: true,
        },
      });
      return userNotification;
    } catch (error) {
      throw new createHttpError.NotFound("User's notification was not found.");
    }
  }
}
