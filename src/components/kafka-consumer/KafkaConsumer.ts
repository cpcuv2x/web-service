import { CarStatus, DriverStatus } from "@prisma/client";
import { inject, injectable } from "inversify";
import { Consumer, KafkaClient } from "kafka-node";
import isEmpty from "lodash/isEmpty";
import isFinite from "lodash/isFinite";
import { Observable, Subject } from "rxjs";
import winston from "winston";
import { Configurations } from "../commons/configurations/Configurations";
import { Utilities } from "../commons/utilities/Utilities";
import { AuthService } from "../services/auth/AuthService";
import { CarStatusMessage } from "../services/cars/interface";
import { DriverStatusMessage } from "../services/drivers/interface";
import { MessageDeviceStatus, MessageKind, MessageType } from "./enums";
import { Message, MessageRaw } from "./interfaces";

@injectable()
export class KafkaConsumer {
  private utilities: Utilities;
  private configurations: Configurations;

  private logger: winston.Logger;

  private kafkaClient!: KafkaClient;
  private kafkaConsumer!: Consumer;
  private onMessageSubject$!: Subject<Message>;

  private driverToCarVerification: Map<string, string>;
  private carToDriverVerification: Map<string, string>;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(Configurations) configurations: Configurations,
  ) {
    this.utilities = utilities;
    this.configurations = configurations;

    this.logger = utilities.getLogger("kafka-consumer");

    this.driverToCarVerification = new Map<string, string>();
    this.carToDriverVerification = new Map<string, string>();

    if (configurations.getConfig().kafka.enabled) {
      this.instantiate();
      this.start();
    }

    this.logger.info("constructed.");
  }

  private instantiate() {
    const { host, topic } = this.configurations.getConfig().kafka;

    this.kafkaClient = new KafkaClient({ kafkaHost: host });

    this.kafkaConsumer = new Consumer(this.kafkaClient, [{ topic }], {
      autoCommit: true,
    });

    this.onMessageSubject$ = new Subject<Message>();
  }

  private start() {
    this.kafkaConsumer.on("message", (kafkaMessage) => {
      const messageRaw: MessageRaw = JSON.parse((kafkaMessage.value as string));
      const message: Message = {};

      if (!isEmpty(messageRaw.car_id)) {
        message.carId = messageRaw.car_id;
      }
      if (!isEmpty(messageRaw.driver_id)) {
        message.driverId = messageRaw.driver_id;
      }

      if (message.driverId != null && message.carId != null &&
        this.verifySender(message.driverId, message.carId)) {

        if (!isEmpty(messageRaw.type)) {
          message.type = messageRaw.type as MessageType;
        }
        if (!isEmpty(messageRaw.kind)) {
          message.kind = messageRaw.kind as MessageKind;
        }
        if (!isEmpty(messageRaw.device_status)) {
          const deviceStatus = messageRaw.device_status!;
          message.deviceStatus = {
            cameraDriver: {
              cameraId: deviceStatus.cam_driver.camera_id!,
              status: deviceStatus.cam_driver.status as MessageDeviceStatus,
            },
            cameraDoor: {
              cameraId: deviceStatus.cam_door.camera_id!,
              status: deviceStatus.cam_door.status as MessageDeviceStatus,
            },
            cameraSeatsFront: {
              cameraId: deviceStatus.cam_front.camera_id!,
              status: deviceStatus.cam_front.status as MessageDeviceStatus,
            },
            cameraSeatsBack: {
              cameraId: deviceStatus.cam_back.camera_id!,
              status: deviceStatus.cam_back.status as MessageDeviceStatus,
            },
            drowsinessModule: {
              status: deviceStatus.drowsiness_module
                .status as MessageDeviceStatus,
            },
            accidentModule: {
              status: deviceStatus.accident_module
                .status as MessageDeviceStatus,
            },
          };
        }
        if (isFinite(messageRaw.passenger)) {
          message.passengers = messageRaw.passenger;
        }
        if (isFinite(messageRaw.ecr)) {
          message.ecr = messageRaw.ecr;
        }
        if (isFinite(messageRaw.ecr_threshold)) {
          message.ecrThreshold = messageRaw.ecr_threshold;
        }
        if (isFinite(messageRaw.response_time)) {
          message.responseTime = messageRaw.response_time;
        }
        if (!isEmpty(messageRaw.lat)) {
          message.lat = parseFloat(messageRaw.lat!);
        }
        if (!isEmpty(messageRaw.lng)) {
          message.lng = parseFloat(messageRaw.lng!);
        }
        if (isFinite(messageRaw.time)) {
          message.timestamp = new Date(messageRaw.time! * 1000);
        }

        this.onMessageSubject$.next(message);

      }

    });
  }

  private verifySender(driverId: string, carId: string) {
    return true;
    //return this.driverToCarVerification.get(driverId) === carId && this.carToDriverVerification.get(carId) === driverId;
  }

  public onMessage$(): Observable<Message> {
    return this.onMessageSubject$;
  }

  public setSenderVerification(driverId: string, carId: string) {
    this.driverToCarVerification.set(driverId, carId);
    this.carToDriverVerification.set(carId, driverId);
  }

  public updateSenderVerifivation(driversStatus: Map<string, DriverStatusMessage>, carStatus: Map<string, CarStatusMessage>) {
    driversStatus.forEach((value, key) => {
      if (value.status !== DriverStatus.ACTIVE) this.driverToCarVerification.delete(key)
    });
    carStatus.forEach((value, key) => {
      if (value.status !== CarStatus.ACTIVE) this.carToDriverVerification.delete(key)
    });
  }
}
