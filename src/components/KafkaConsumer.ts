import { Consumer, KafkaClient } from "kafka-node";
import { map, Observable } from "rxjs";
import { Configurations } from "../commons/Configurations";
import { SocketIO } from "./SocketIO";

interface KafkaConsumerDependencies {
  configurations: Configurations;
  socketIO: SocketIO;
}

export class KafkaConsumer {
  private dependencies: KafkaConsumerDependencies;

  private kafkaClient!: KafkaClient;
  private kafkaConsumer!: Consumer;

  constructor(dependencies: KafkaConsumerDependencies) {
    this.dependencies = dependencies;

    const { configurations } = this.dependencies;

    if (configurations.getConfig().kafka.enabled) {
      this.instanciateKafkaConsumer();
      this.broadcastToSockets();
    }
  }

  private instanciateKafkaConsumer() {
    const { configurations } = this.dependencies;

    const { host, jsonEventsTopicName } = configurations.getConfig().kafka;

    this.kafkaClient = new KafkaClient({ kafkaHost: host });

    this.kafkaConsumer = new Consumer(
      this.kafkaClient,
      [{ topic: jsonEventsTopicName! }],
      {
        autoCommit: true,
      }
    );
  }

  private onMessage$(): Observable<string> {
    return new Observable<string>((observer) => {
      this.kafkaConsumer.on("message", (message) => {
        observer.next(message.value as string);
      });
    });
  }

  private broadcastToSockets() {
    this.onMessage$()
      .pipe(map((message) => JSON.parse(message)))
      .subscribe(({ type, ...rest }) => {
        this.dependencies.socketIO.broadcast(type, rest);
      });
  }
}
