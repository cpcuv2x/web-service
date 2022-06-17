import { inject, injectable } from "inversify";
import { filter, Subscription } from "rxjs";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { DBPolling } from "../db-polling/DBPolling";
import { DBSync } from "../db-sync/DBSync";
import { HttpServer } from "../http-server/HttpServer";
import { MessageKind, MessageType } from "../kafka-consumer/enums";
import { KafkaConsumer } from "../kafka-consumer/KafkaConsumer";
import { SocketEventType } from "./enums";

@injectable()
export class SocketIO {
  private utilities: Utilities;
  private httpServer: HttpServer;
  private kafkaConsumer: KafkaConsumer;
  private dbPolling: DBPolling;
  private dbSync: DBSync;

  private logger: winston.Logger;

  private socketIOServer!: Server;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(HttpServer) httpServer: HttpServer,
    @inject(KafkaConsumer) kafkaConsumer: KafkaConsumer,
    @inject(DBPolling) dbPolling: DBPolling,
    @inject(DBSync) dbSync: DBSync
  ) {
    this.utilities = utilities;
    this.httpServer = httpServer;
    this.kafkaConsumer = kafkaConsumer;
    this.dbPolling = dbPolling;
    this.dbSync = dbSync;

    this.logger = this.utilities.getLogger("socket-io");

    this.instantiate();
    this.start();
    this.logger.info("constructed.");
  }

  private instantiate() {
    this.socketIOServer = new Server(this.httpServer.getHttpServerInstance(), {
      cors: {
        origin: "*",
      },
    });
  }

  private start() {
    this.socketIOServer.on("connection", (socket) => {
      this.logger.info(`connection established for socket ${socket.id}.`);
      const subscriptionMap = new Map<string, Subscription>();

      socket.on(SocketEventType.StartStreamActiveCars, (callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamActiveCars}.`
        );
        const subscriptionId = uuidv4();
        subscriptionMap.set(
          subscriptionId,
          this.dbPolling.pollActiveCars().subscribe((result) => {
            socket.emit(subscriptionId, result);
          })
        );
        this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
        callback(subscriptionId);
      });

      socket.on(SocketEventType.StartStreamActiveDrivers, (callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamActiveDrivers}.`
        );
        const subscriptionId = uuidv4();
        subscriptionMap.set(
          subscriptionId,
          this.dbPolling.pollActiveDrivers().subscribe((result) => {
            socket.emit(subscriptionId, result);
          })
        );
        this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
        callback(subscriptionId);
      });

      socket.on(SocketEventType.StartStreamTotalPassengers, (callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamTotalPassengers}.`
        );
        const subscriptionId = uuidv4();
        subscriptionMap.set(
          subscriptionId,
          this.dbPolling
            .pollTotalPassengers()
            .subscribe((result) => socket.emit(subscriptionId, result))
        );
        this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
        callback(subscriptionId);
      });

      socket.on(SocketEventType.StartStreamTotalAccidentCount, (callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamTotalAccidentCount}.`
        );
        const subscriptionId = uuidv4();
        subscriptionMap.set(
          subscriptionId,
          this.dbPolling
            .pollTotalAccidentCount()
            .subscribe((result) => socket.emit(subscriptionId, result))
        );
        this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
        callback(subscriptionId);
      });

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
              filter(
                (message) =>
                  message.type === MessageType.Metric &&
                  (message.kind === MessageKind.CarLocation ||
                    message.kind === MessageKind.CarPassengers) &&
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

      socket.on(SocketEventType.StartStreamCarPassengers, (carId, callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamCarPassengers}.`
        );
        const subscriptionId = uuidv4();
        subscriptionMap.set(
          subscriptionId,
          this.kafkaConsumer
            .onMessage$()
            .pipe(
              filter(
                (message) =>
                  message.type === MessageType.Metric &&
                  message.kind === MessageKind.CarPassengers &&
                  message.carId === carId
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
        SocketEventType.StartStreamDriverInformation,
        (driverId, callback) => {
          this.logger.info(
            `socket ${socket.id} received event ${SocketEventType.StartStreamDriverInformation}.`
          );
          const subscriptionId = uuidv4();
          subscriptionMap.set(
            subscriptionId,
            this.dbPolling
              .pollDriverInformation(driverId)
              .subscribe((driver) => {
                socket.emit(subscriptionId, driver);
              })
          );
          this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
          callback(subscriptionId);
        }
      );

      socket.on(SocketEventType.StartStreamDriverECR, (driverId, callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamDriverECR}.`
        );
        const subscriptionId = uuidv4();
        subscriptionMap.set(
          subscriptionId,
          this.kafkaConsumer
            .onMessage$()
            .pipe(
              filter(
                (message) =>
                  message.type === MessageType.Metric &&
                  message.kind === MessageKind.DriverECR &&
                  message.driverId === driverId
              )
            )
            .subscribe((message) => {
              socket.emit(subscriptionId, message);
            })
        );
        this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
        callback(subscriptionId);
      });

      socket.on(SocketEventType.StartStreamNotification, (callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamNotification}.`
        );
        const subscriptionId = uuidv4();
        subscriptionMap.set(
          subscriptionId,
          this.dbSync
            .onNotification$()
            .subscribe((notification) =>
              socket.emit(subscriptionId, notification)
            )
        );
        this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
        callback(subscriptionId);
      });

      socket.on(SocketEventType.StartStreamHeartbeatsStatus, (callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamHeartbeatsStatus}.`
        );
        const subscriptionId = uuidv4();
        subscriptionMap.set(
          subscriptionId,
          this.kafkaConsumer
            .onMessage$()
            .pipe(
              filter(
                (message) =>
                  message.type === MessageType.Heartbeat &&
                  message.kind === MessageKind.Car
              )
            )
            .subscribe((message) => {
              socket.emit(subscriptionId, message);
            })
        );
        this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
        callback(subscriptionId);
      });

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
