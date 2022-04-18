import { CarStatus, DriverStatus, Notification } from "@prisma/client";
import { inject, injectable } from "inversify";
import {
  filter,
  Observable,
  Subject,
  Subscription,
  throttleTime,
  timer,
} from "rxjs";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { MessageKind, MessageType } from "../kafka-consumer/enums";
import { KafkaConsumer } from "../kafka-consumer/KafkaConsumer";
import { CarServices } from "../services/cars/CarService";
import { DriverService } from "../services/drivers/DriverService";
import { LogService } from "../services/logs/LogService";
import { NotificiationService } from "../services/notifications/NotificationService";

@injectable()
export class DBSync {
  private utilities: Utilities;
  private kafkaConsumer: KafkaConsumer;
  private carServices: CarServices;
  private driverService: DriverService;
  private logService: LogService;
  private notificationServices: NotificiationService;

  private logger: winston.Logger;

  private onNotificationSubject$: Subject<Notification>;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(KafkaConsumer) kafkaConsumer: KafkaConsumer,
    @inject(CarServices) carServices: CarServices,
    @inject(DriverService) driverService: DriverService,
    @inject(LogService) logService: LogService,
    @inject(NotificiationService) notificationServices: NotificiationService
  ) {
    this.utilities = utilities;
    this.kafkaConsumer = kafkaConsumer;
    this.carServices = carServices;
    this.driverService = driverService;
    this.logService = logService;
    this.notificationServices = notificationServices;

    this.logger = utilities.getLogger("db-sync");

    this.onNotificationSubject$ = new Subject<Notification>();

    this.start();

    this.logger.info("constructed.");
  }

  private start() {
    // Experiments
    this.carServices.getCars({}).then((result) => {
      // TODO: Store subscriptions
      result.cars.forEach((car) => {
        this.kafkaConsumer
          .onMessage$()
          .pipe(
            filter(
              (message) =>
                message.type === MessageType.Metric &&
                message.kind === MessageKind.CarLocation &&
                message.carId === car.id
            ),
            throttleTime(30000)
          )
          .subscribe((json) => {
            this.logger.verbose(
              `called carServices.updateCar for ${json.carId} with lat ${json.lat} and long ${json.lng}.`
            );
            this.carServices.updateCar(json.carId!, {
              lat: json.lat,
              long: json.lng,
            });
          });
        this.kafkaConsumer
          .onMessage$()
          .pipe(
            filter(
              (message) =>
                message.type === MessageType.Metric &&
                message.kind === MessageKind.CarPassengers &&
                message.carId === car.id
            ),
            throttleTime(30000)
          )
          .subscribe((json) => {
            this.logger.verbose(
              `called carServices.updateCar for ${json.carId} with passengers ${json.passengers}.`
            );
            this.carServices.updateCar(json.carId!, {
              passengers: json.passengers,
            });
          });
      });
    });

    this.kafkaConsumer
      .onMessage$()
      .pipe(
        filter(
          (message) =>
            message.type === MessageType.Event &&
            message.kind === MessageKind.Accident
        )
      )
      .subscribe(async (message) => {
        const notification =
          await this.notificationServices.createAccidentNotification(message);
        await this.logService.createAccidentLog(message);
        this.onNotificationSubject$.next(notification);
      });

    this.kafkaConsumer
      .onMessage$()
      .pipe(
        filter(
          (message) =>
            message.type === MessageType.Event &&
            message.kind === MessageKind.DrowsinessAlarm
        )
      )
      .subscribe(async (message) => {
        const notification =
          await this.notificationServices.createDrowsinessNotification(message);
        this.onNotificationSubject$.next(notification);
      });

    this.carServices.getCars({}).then((result) => {
      result.cars.forEach((car) => {
        let heartbeatTimeoutSubscription: Subscription;
        this.kafkaConsumer
          .onMessage$()
          .pipe(
            filter(
              (message) =>
                message.type === MessageType.Heartbeat &&
                message.kind === MessageKind.Car &&
                message.carId === car.id
            )
          )
          .subscribe((json) => {
            this.carServices.updateCar(json.carId!, {
              status: CarStatus.ACTIVE,
            });
            this.driverService.updateDriver(json.driverId!, {
              status: DriverStatus.ACTIVE,
            });

            if (heartbeatTimeoutSubscription) {
              heartbeatTimeoutSubscription.unsubscribe();
            }

            heartbeatTimeoutSubscription = timer(180000).subscribe(() => {
              this.carServices.updateCar(json.carId!, {
                status: CarStatus.INACTIVE,
              });
              this.driverService.updateDriver(json.driverId!, {
                status: DriverStatus.INACTIVE,
              });
            });
          });
      });
    });
  }

  public onNotification$(): Observable<Notification> {
    return this.onNotificationSubject$;
  }
}
