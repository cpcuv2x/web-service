import {
  CameraStatus,
  CarStatus,
  DriverStatus,
  Notification
} from "@prisma/client";
import { inject, injectable } from "inversify";
import {
  filter,
  Observable,
  Subject,
  Subscription,
  throttleTime,
  timer
} from "rxjs";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import {
  MessageDeviceStatus,
  MessageKind,
  MessageType
} from "../kafka-consumer/enums";
import { KafkaConsumer } from "../kafka-consumer/KafkaConsumer";
import { CameraService } from "../services/cameras/CameraService";
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
  private cameraService: CameraService;
  private logService: LogService;
  private notificationServices: NotificiationService;

  private logger: winston.Logger;

  private onNotificationSubject$: Subject<Notification>;
  private carHeartbeatTimeoutSubscriptionMap: Map<string, Subscription>;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(KafkaConsumer) kafkaConsumer: KafkaConsumer,
    @inject(CarServices) carServices: CarServices,
    @inject(DriverService) driverService: DriverService,
    @inject(CameraService) cameraService: CameraService,
    @inject(LogService) logService: LogService,
    @inject(NotificiationService) notificationServices: NotificiationService
  ) {
    this.utilities = utilities;
    this.kafkaConsumer = kafkaConsumer;
    this.carServices = carServices;
    this.driverService = driverService;
    this.cameraService = cameraService;
    this.logService = logService;
    this.notificationServices = notificationServices;

    this.logger = utilities.getLogger("db-sync");

    this.onNotificationSubject$ = new Subject<Notification>();
    this.carHeartbeatTimeoutSubscriptionMap = new Map<string, Subscription>();

    this.start();

    this.logger.info("constructed.");
  }

  private start() {
    this.kafkaConsumer
      .onMessage$()
      .pipe(
        filter(
          (message) =>
            message.type === MessageType.Metric &&
            message.kind === MessageKind.CarLocation
        ),
        throttleTime(30000)
      )
      .subscribe((message) => {
        this.carServices
          .getCarById(message.carId!)
          .then((car) => {
            if (car.status === CarStatus.ACTIVE) {
              this.carServices
                .updateCar(message.carId!, {
                  lat: message.lat,
                  long: message.lng,
                })
                .catch((error) => {});
            }
          })
          .catch((error) => {});
      });

    this.kafkaConsumer
      .onMessage$()
      .pipe(
        filter(
          (message) =>
            message.type === MessageType.Metric &&
            message.kind === MessageKind.CarPassengers
        ),
        throttleTime(30000)
      )
      .subscribe((message) => {
        this.carServices
          .getCarById(message.carId!)
          .then((car) => {
            if (car.status === CarStatus.ACTIVE) {
              this.carServices
                .updateCar(message.carId!, {
                  passengers: message.passengers,
                })
                .catch((error) => {});
            }
          })
          .catch((error) => {});
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
      .subscribe((message) => {
        this.carServices
          .getCarById(message.carId!)
          .then((car) => {
            if (car.status === CarStatus.ACTIVE) {
              this.notificationServices
                .createAccidentNotification(message)
                .then((notification) => {
                  this.onNotificationSubject$.next(notification);
                })
                .catch((error) => {});
              this.logService.createAccidentLog(message).catch((error) => {});
            }
          })
          .catch((error) => {});
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
      .subscribe((message) => {
        this.carServices
          .getCarById(message.carId!)
          .then((car) => {
            if (car.status === CarStatus.ACTIVE) {
              this.notificationServices
                .createDrowsinessNotification(message)
                .then((notification) => {
                  this.onNotificationSubject$.next(notification);
                })
                .catch((error) => {});
              this.logService.createDrowsinessAlarmLog(message).catch((error) => {});
            }
          })
          .catch((error) => {});
      });

    this.kafkaConsumer
      .onMessage$()
      .pipe(
        filter(
          (message) =>
            message.type === MessageType.Heartbeat &&
            message.kind === MessageKind.Car
        )
      )
      .subscribe(async (message) => {
        const carId = message.carId!;
        const driverId = message.driverId!;
        const cameraDriverId = message.deviceStatus!.cameraDriver.cameraId;
        const cameraDriverStatus = message.deviceStatus!.cameraDriver.status;
        const cameraDoorId = message.deviceStatus!.cameraDoor.cameraId;
        const cameraDoorStatus = message.deviceStatus!.cameraDoor.status;
        const cameraSeatsFrontId =
          message.deviceStatus!.cameraSeatsFront.cameraId;
        const cameraSeatsFrontStatus =
          message.deviceStatus!.cameraSeatsFront.status;
        const cameraSeatsBackId =
          message.deviceStatus!.cameraSeatsBack.cameraId;
        const cameraSeatsBackStatus =
          message.deviceStatus!.cameraSeatsBack.status;

        this.carServices
          .updateCar(carId, {
            status: CarStatus.ACTIVE,
            driverId: driverId,
          })
          .catch((error) => {});
        this.driverService
          .updateDriver(driverId, {
            status: DriverStatus.ACTIVE,
          })
          .catch((error) => {});
        this.cameraService
          .updateCamera(cameraDriverId, {
            status:
              cameraDriverStatus === MessageDeviceStatus.Active
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
          })
          .catch((error) => {});
        this.cameraService
          .updateCamera(cameraDoorId, {
            status:
              cameraDoorStatus === MessageDeviceStatus.Active
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
          })
          .catch((error) => {});
        this.cameraService
          .updateCamera(cameraSeatsFrontId, {
            status:
              cameraSeatsFrontStatus === MessageDeviceStatus.Active
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
          })
          .catch((error) => {});
        this.cameraService
          .updateCamera(cameraSeatsBackId, {
            status:
              cameraSeatsBackStatus === MessageDeviceStatus.Active
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
          })
          .catch((error) => {});

        this.carHeartbeatTimeoutSubscriptionMap.get(carId)?.unsubscribe();

        this.carHeartbeatTimeoutSubscriptionMap.set(
          carId,
          timer(130000).subscribe(async () => {
            this.carServices
              .updateCar(carId, {
                status: CarStatus.INACTIVE,
                lat: 0,
                long: 0,
                passengers: 0,
                driverId: null,
              })
              .catch((error) => {
                console.log(error);
              });
            this.driverService
              .updateDriver(driverId, {
                status: DriverStatus.INACTIVE,
              })
              .catch((error) => {});
            this.cameraService
              .updateCamera(cameraDriverId, {
                status: CameraStatus.INACTIVE,
              })
              .catch((error) => {});
            this.cameraService
              .updateCamera(cameraDoorId, {
                status: CameraStatus.INACTIVE,
              })
              .catch((error) => {});
            this.cameraService
              .updateCamera(cameraSeatsFrontId, {
                status: CameraStatus.INACTIVE,
              })
              .catch((error) => {});
            this.cameraService
              .updateCamera(cameraSeatsBackId, {
                status: CameraStatus.INACTIVE,
              })
              .catch((error) => {});
          })
        );
      });
  }

  public onNotification$(): Observable<Notification> {
    return this.onNotificationSubject$;
  }
}
