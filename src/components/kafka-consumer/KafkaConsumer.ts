import { inject, injectable } from "inversify";
import { Consumer, KafkaClient } from "kafka-node";
import isEmpty from "lodash/isEmpty";
import { Observable, Subject } from "rxjs";
import winston from "winston";
import { Configurations } from "../commons/configurations/Configurations";
import { Utilities } from "../commons/utilities/Utilities";
import { EventMessageType, EventStatus } from "./enums";
import { EventMessage, EventMessageRaw } from "./interfaces";
@injectable()
export class KafkaConsumer {
  private utilities: Utilities;
  private configurations: Configurations;

  private logger: winston.Logger;

  private kafkaClient!: KafkaClient;
  private kafkaConsumer!: Consumer;
  private onMessageSubject$!: Subject<EventMessage>;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(Configurations) configurations: Configurations
  ) {
    this.utilities = utilities;
    this.configurations = configurations;

    this.logger = utilities.getLogger("kafka-consumer");

    if (configurations.getConfig().kafka.enabled) {
      this.instantiate();
      this.start();
    }

    this.logger.info("constructed.");
  }

  private instantiate() {
    const { host, jsonEventsTopicName } = this.configurations.getConfig().kafka;

    this.kafkaClient = new KafkaClient({ kafkaHost: host });

    this.kafkaConsumer = new Consumer(
      this.kafkaClient,
      [{ topic: jsonEventsTopicName! }],
      {
        autoCommit: true,
      }
    );

    this.onMessageSubject$ = new Subject<EventMessage>();
  }

  private start() {
    this.kafkaConsumer.on("message", (message) => {
      const eventMessageRaw: EventMessageRaw = JSON.parse(
        message.value as string
      );

      const eventMessage: EventMessage = {};

      if (!isEmpty(eventMessageRaw.car_id)) {
        eventMessage.carId = eventMessageRaw.car_id;
      }
      if (!isEmpty(eventMessageRaw.driver_id)) {
        eventMessage.driverId = eventMessageRaw.driver_id;
      }
      if (!isEmpty(eventMessageRaw.camera_id)) {
        eventMessage.cameraId = eventMessageRaw.camera_id;
      }
      if (!isEmpty(eventMessageRaw.lat)) {
        eventMessage.lat = parseFloat(eventMessageRaw.lat!);
      }
      if (!isEmpty(eventMessageRaw.lng)) {
        eventMessage.lng = parseFloat(eventMessageRaw.lng!);
      }
      if (!isEmpty(eventMessageRaw.time)) {
        eventMessage.timestamp = new Date(eventMessageRaw.time!);
      }
      if (!isEmpty(eventMessageRaw.type)) {
        eventMessage.type = eventMessageRaw.type as EventMessageType;
      }
      if (!isEmpty(eventMessageRaw.passenger)) {
        eventMessage.passengers = eventMessageRaw.passenger;
      }
      if (!isEmpty(eventMessageRaw.ecr)) {
        eventMessage.ecr = eventMessageRaw.ecr;
      }
      if (!isEmpty(eventMessageRaw.status)) {
        eventMessage.status = eventMessageRaw.status as EventStatus;
      }

      this.onMessageSubject$.next(eventMessage);
    });
  }

  public onMessage$(): Observable<EventMessage> {
    return this.onMessageSubject$;
  }
}
