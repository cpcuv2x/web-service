import { inject, injectable } from "inversify";
import { filter, map, Subscription } from "rxjs";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { DBPolling } from "../db-polling/DBPolling";
import { HttpServer } from "../http-server/HttpServer";
import { KafkaConsumer } from "../kafka-consumer/KafkaConsumer";
import { SocketEventType } from "./enums";
@injectable()
export class SocketIO {
  private utilities: Utilities;
  private httpServer: HttpServer;
  private kafkaConsumer: KafkaConsumer;
  private dbPolling: DBPolling;

  private logger: winston.Logger;

  private socketIOServer!: Server;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(HttpServer) httpServer: HttpServer,
    @inject(KafkaConsumer) kafkaConsumer: KafkaConsumer,
    @inject(DBPolling) dbPolling: DBPolling
  ) {
    this.utilities = utilities;
    this.httpServer = httpServer;
    this.kafkaConsumer = kafkaConsumer;
    this.dbPolling = dbPolling;

    this.logger = this.utilities.getLogger("socket-io");

    this.instantiate();
    this.start();
    this.logger.info("constructed.");
  }

  private instantiate() {
    this.socketIOServer = new Server(this.httpServer.getHttpServerInstance());
  }

  private start() {
    this.socketIOServer.on("connection", (socket) => {
      this.logger.info(`connection established for socket ${socket.id}.`);
      const subscriptionMap = new Map<string, Subscription>();

      socket.on(SocketEventType.StartStreamMapCars, (mapCarIds, callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamMapCars}.`
        );
        const subscriptionId = uuidv4();
        subscriptionMap.set(
          subscriptionId,
          this.kafkaConsumer
            .onMessage$()
            .pipe(
              map((message) => JSON.parse(message as string)),
              filter((message) =>
                mapCarIds.find((id: any) => id === message.carId)
              )
            )
            .subscribe((message) => {
              socket.emit(subscriptionId, message);
            })
        );
        this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
        callback(subscriptionId);
      });

      socket.on(
        SocketEventType.StartStreamCarInformation,
        (carId, callback) => {
          this.logger.info(
            `socket ${socket.id} received event ${SocketEventType.StartStreamCarInformation}.`
          );
          const subscriptionId = uuidv4();
          subscriptionMap.set(
            subscriptionId,
            this.dbPolling.pollCarInformation(carId).subscribe((car) => {
              socket.emit(subscriptionId, car);
            })
          );
          this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
          callback(subscriptionId);
        }
      );

      socket.on(SocketEventType.StopStream, (subscriptionId) => {
        this.logger.info(
          `unsubscribed subscription ${subscriptionId} for socket ${socket.id}.`
        );
        subscriptionMap.get(subscriptionId)?.unsubscribe();
      });

      socket.on("disconnect", () => {
        this.logger.info(`socket ${socket.id} disconnected, cleaning up.`);
        for (const subscription of subscriptionMap.values()) {
          subscription.unsubscribe();
        }
      });
    });
  }
}
