import { inject, injectable } from "inversify";
import { Consumer, KafkaClient } from "kafka-node";
import { Observable, Subject } from "rxjs";
import winston from "winston";
import { Configurations } from "../commons/configurations/Configurations";
import { Utilities } from "../commons/utilities/Utilities";

@injectable()
export class KafkaConsumer {
  private utilities: Utilities;
  private configurations: Configurations;

  private logger: winston.Logger;

  private kafkaClient!: KafkaClient;
  private kafkaConsumer!: Consumer;
  private onMessageSubject$!: Subject<string>;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(Configurations) configurations: Configurations
  ) {
    this.utilities = utilities;
    this.configurations = configurations;

    this.logger = utilities.getLogger("kafka-consuemr");

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

    this.onMessageSubject$ = new Subject<string>();
  }

  private start() {
    this.kafkaConsumer.on("message", (message) => {
      this.onMessageSubject$.next(message.value as string);
    });
  }

  public onMessage$(): Observable<string> {
    return this.onMessageSubject$;
  }
}
