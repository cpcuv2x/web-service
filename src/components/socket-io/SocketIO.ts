import { inject, injectable } from "inversify";
import { Subscription } from "rxjs";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { DBPolling } from "../db-polling/DBPolling";
import { DBSync } from "../db-sync/DBSync";
import { HttpServer } from "../http-server/HttpServer";
import { SocketEventType } from "./enums";

@injectable()
export class SocketIO {
  private utilities: Utilities;
  private httpServer: HttpServer;
  private dbPolling: DBPolling;
  private dbSync: DBSync;

  private logger: winston.Logger;

  private socketIOServer!: Server;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(HttpServer) httpServer: HttpServer,
    @inject(DBPolling) dbPolling: DBPolling,
    @inject(DBSync) dbSync: DBSync
  ) {
    this.utilities = utilities;
    this.httpServer = httpServer;
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
          this.dbPolling
            .pollCronedPassengersWithID(carId)
            .subscribe((passengers) => {
              socket.emit(subscriptionId, passengers);
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

      socket.on(SocketEventType.StartStreamDriverECR, async (driverId, callback) => {
        this.logger.info(
          `socket ${socket.id} received event ${SocketEventType.StartStreamDriverECR}.`
        );
        const subscriptionId = uuidv4();

        subscriptionMap.set(
          subscriptionId,
          this.dbPolling
            .pollCronedECRsWithID(driverId)
            .subscribe((ecrMessage) => {
              socket.emit(subscriptionId, ecrMessage);
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
          this.dbPolling
            .pollHeartbeatStatus()
            .subscribe((heartbeat) => {
              socket.emit(subscriptionId, heartbeat);
            })
        );
        this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
        callback(subscriptionId);
      })

      socket.on(SocketEventType.StopStream, (subscriptionId) => {
        this.logger.info(
          `unsubscribed subscription ${subscriptionId} for socket ${socket.id}.`
        );
        const subscription = subscriptionMap.get(subscriptionId);
        if (subscription != null) subscription.unsubscribe();
      });

      socket.on(
        SocketEventType.StartStreamOverview,
        (callback) => {
          this.logger.info(
            `socket ${socket.id} received event ${SocketEventType.StartStreamOverview}.`
          );
          const subscriptionId = uuidv4();
          subscriptionMap.set(
            subscriptionId,
            this.dbPolling.pollOverviews().subscribe((res) => {
              socket.emit(subscriptionId, res);
            })
          );
          this.logger.info(`socket ${socket.id} subscribed ${subscriptionId}.`);
          callback(subscriptionId);
        }
      );

      socket.on("disconnect", () => {
        this.logger.info(`socket ${socket.id} disconnected, cleaning up.`);
        for (const subscription of subscriptionMap.values()) {
          if (subscription != null) subscription.unsubscribe();
        }
      });
    });
  }

}
