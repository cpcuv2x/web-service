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

    this.instanciateKafkaConsumer();
    this.broadcastToSockets();
  }

  private instanciateKafkaConsumer() {
    const { configurations } = this.dependencies;

    const kafkaHost = configurations.getConfig().kafka.host;

    this.kafkaClient = new KafkaClient({ kafkaHost });

    this.kafkaConsumer = new Consumer(
      this.kafkaClient,
      [{ topic: "cpcuv2x-json-events" }],
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
