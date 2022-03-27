import { inject, injectable } from "inversify";
import { Consumer, KafkaClient } from "kafka-node";
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

      eventMessage.carId = eventMessageRaw.car_id;
      eventMessage.driverId = eventMessageRaw.driver_id;
      eventMessage.cameraId = eventMessageRaw.camera_id;
      eventMessage.lat = parseFloat(eventMessageRaw.lat!);
      eventMessage.lng = parseFloat(eventMessageRaw.lng!);
      eventMessage.time = eventMessageRaw.time ?? Date.now();
      eventMessage.type = eventMessageRaw.type as EventMessageType;
      eventMessage.passengers = eventMessageRaw.passenger;
      eventMessage.ecr = eventMessageRaw.ecr;
      eventMessage.status = eventMessageRaw.status as EventStatus;

      this.logger.verbose(message.value)

      this.onMessageSubject$.next(eventMessage);
    });
  }

  public onMessage$(): Observable<EventMessage> {
    return this.onMessageSubject$;
  }
}
