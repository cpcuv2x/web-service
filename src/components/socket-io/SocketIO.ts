import { CarStatus } from "@prisma/client";
import { CronJob } from "cron";
import { inject, injectable } from "inversify";
import { filter, interval, Subscription } from "rxjs";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { DBPolling } from "../db-polling/DBPolling";
import { DBSync } from "../db-sync/DBSync";
import { HttpServer } from "../http-server/HttpServer";
import { MessageKind, MessageType } from "../kafka-consumer/enums";
import { Message } from "../kafka-consumer/interfaces";
import { KafkaConsumer } from "../kafka-consumer/KafkaConsumer";
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
      const subscriptionMap = new Map<string, Subscription | CronJob>();

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
        const tempLocation = this.dbSync.onTempLocation$();

        this.dbPolling
          .pollCarsLocation()
          .then((res) => res.forEach(({ carId, lat, lng }) => {
            const temp = tempLocation?.get(carId) != null ? tempLocation?.get(carId) : { lat, lng };
            socket.emit(subscriptionId, { carId, ...temp, status: CarStatus.INACTIVE })
          }))

        subscriptionMap.set(
          subscriptionId,
          interval(1000)
            .subscribe(() => {
              const tempLocations = this.dbSync.onTempLocation$();
              for (const carId of mapCarIds) {
                if (tempLocations != null) {
                  const location = tempLocations.get(carId);
                  const status = this.dbSync.onTempStatusWithID$(carId)?.status;
                  socket.emit(subscriptionId, { carId, ...location, status })
                }
                else {
                  const status = this.dbSync.onTempStatusWithID$(carId)?.status;
                  socket.emit(subscriptionId, { carId, status })
                }
              }
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

        const intervalCronjob = new CronJob('0 * * * * *', async () => {
          const message = this.dbSync.onTempPassengersWithID$(carId);
          let time = new Date();

          if (message != null && time.getTime() - message.timestamp!.getTime() <= 60000) {
            let { passengers, timestamp } = message;
            timestamp = this.setZeroSecondsAndMilliseconds(timestamp!);
            socket.emit(subscriptionId, { passengers, timestamp })
          }
          else {
            time.setMinutes(time.getMinutes() - 1);
            time = this.setZeroSecondsAndMilliseconds(time);
            socket.emit(subscriptionId, { passengers: 0, timestamp: time })
          }
        })

        if (!intervalCronjob.running) {
          intervalCronjob.start();
        }

        subscriptionMap.set(
          subscriptionId,
          intervalCronjob
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

        const intervalCronjob = new CronJob('0 * * * * *', async () => {
          const message = this.dbSync.onTempECRWithID$(driverId);
          let time = new Date()

          if (message != null && time.getTime() - message.timestamp!.getTime() <= 60000) {
            let { ecr, ecrThreshold, timestamp } = message;
            timestamp = this.setZeroSecondsAndMilliseconds(timestamp!);
            socket.emit(subscriptionId, { ecr, ecrThreshold, timestamp })
          }
          else {
            const ecrThreshold = this.dbSync.onTempECRWithID$(driverId)?.ecrThreshold;
            time.setMinutes(time.getMinutes() - 1);
            time = this.setZeroSecondsAndMilliseconds(time);
            socket.emit(subscriptionId, { ecr: 0, ecrThreshold: ecrThreshold, timestamp: time })
          }
        })

        if (!intervalCronjob.running) {
          intervalCronjob.start();
        }

        subscriptionMap.set(
          subscriptionId,
          intervalCronjob
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
        if (subscription != null) this.unsubscribe(subscription)
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
          if (subscription != null) this.unsubscribe(subscription)
        }
      });
    });
  }

  private unsubscribe(subscription: Subscription | CronJob) {
    if (subscription instanceof Subscription) {
      subscription.unsubscribe()
    }
    else if (subscription instanceof CronJob) {
      subscription.stop()
    }
  }

  private setZeroSecondsAndMilliseconds(timestamp: Date) {
    const temp = new Date(timestamp);
    temp.setSeconds(0);
    temp.setMilliseconds(0);
    return temp;
  }
}
