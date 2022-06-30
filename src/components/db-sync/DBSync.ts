import {
  CameraStatus,
  CarStatus,
  Driver,
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
import { runInThisContext } from "vm";
import winston from "winston";
import { ModuleRole } from "../../enum/ModuleRole";
import { Status } from "../../enum/Status";
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
  private tempPassenger$: Map<string, [Date, number]>;
  private tempECR$: Map<string, [Date, number]>;
  private tempECRThreshold$: Map<string, number>;

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
    this.tempPassenger$ = new Map<string, [Date, number]>();
    this.tempECR$ = new Map<string, [Date, number]>();
    this.tempECRThreshold$ = new Map<string, number>();

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
                .catch((error) => { });
            }
          })
          .catch((error) => { });
      });

    this.kafkaConsumer
      .onMessage$()
      .pipe(
        filter(
          (message) =>
            message.type === MessageType.Metric &&
            message.kind === MessageKind.CarPassengers
        ),
      )
      .subscribe((message) => {

        const carId = message.carId;
        const timestamp = message.timestamp;
        const passengers = message.passengers;

        if (carId != null && timestamp != null && passengers != null)
          this.tempPassenger$.set(carId, [timestamp, passengers]);

        if (carId != null)
          this.carServices
            .getCarById(carId)
            .then((car) => {
              if (car.status === CarStatus.ACTIVE) {
                this.carServices
                  .updateCar(carId!, {
                    passengers: passengers,
                  })
                  .catch((error) => { });
              }
            })
            .catch((error) => { });
      });

    this.kafkaConsumer
      .onMessage$()
      .pipe(
        filter(
          (message) =>
            message.type === MessageType.Metric &&
            message.kind === MessageKind.DriverECR
        )
      )
      .subscribe((message) => {

        const driverId = message.driverId;
        const ecr = message.ecr;
        const ecrThreshold = message.ecrThreshold;
        const timestamp = message.timestamp;

        if (driverId != null) {
          if (ecrThreshold != null &&
            this.tempECRThreshold$.get(driverId) !== ecrThreshold) {
            this.tempECRThreshold$.set(driverId, ecrThreshold);
            this.driverService.updateDriver(message.driverId!, { ecrThreshold: message.ecrThreshold });
          }
          if (ecr != null && timestamp != null) {
            this.tempECR$.set(driverId, [timestamp, ecr]);
          }
        }
      })

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
                .catch((error) => { });
              this.logService.createAccidentLog(message).catch((error) => { });
            }
          })
          .catch((error) => { });
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
                .catch((error) => { });
              this.logService.createDrowsinessAlarmLog(message).catch((error) => { });
            }
          })
          .catch((error) => { });
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
        const accidentModuleStatus =
          message.deviceStatus?.accidentModule.status;
        const drowsinessModuleStatus =
          message.deviceStatus?.drowsinessModule.status;

        const time = new Date();
        //time.setHours(time.getHours()+7);

        this.carServices
          .updateCar(carId, {
            status: CarStatus.ACTIVE,
            driverId: driverId,
            timestamp: time
          })
          .catch((error) => { });
        this.driverService
          .updateDriver(driverId, {
            status: DriverStatus.ACTIVE,
            timestamp: time
          })
          .catch((error) => { });
        this.cameraService
          .updateCamera(cameraDriverId, {
            status:
              cameraDriverStatus === MessageDeviceStatus.ACTIVE
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
            timestamp: time
          })
          .catch((error) => { });
        this.cameraService
          .updateCamera(cameraDoorId, {
            status:
              cameraDoorStatus === MessageDeviceStatus.ACTIVE
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
            timestamp: time
          })
          .catch((error) => { });
        this.cameraService
          .updateCamera(cameraSeatsFrontId, {
            status:
              cameraSeatsFrontStatus === MessageDeviceStatus.ACTIVE
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
            timestamp: time
          })
          .catch((error) => { });
        this.cameraService
          .updateCamera(cameraSeatsBackId, {
            status:
              cameraSeatsBackStatus === MessageDeviceStatus.ACTIVE
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
            timestamp: time
          })
          .catch((error) => { });

        this.carServices
          .updateModule(carId, ModuleRole.ACCIDENT_MODULE, {
            status: accidentModuleStatus === MessageDeviceStatus.ACTIVE ? Status.ACTIVE : Status.INACTIVE,
            timestamp: time
          })
          .catch(() => { })
        this.carServices
          .updateModule(carId, ModuleRole.DROWSINESS_MODULE, {
            status: drowsinessModuleStatus === MessageDeviceStatus.ACTIVE ? Status.ACTIVE : Status.INACTIVE,
            timestamp: time
          })
          .catch(() => { })
      });
  }

  public onNotification$(): Observable<Notification> {
    return this.onNotificationSubject$;
  }

  public syncECRThreshold(id: string, ecrThreshold: number): Promise<Driver> {
    return this.driverService.updateDriver(id, { ecrThreshold: ecrThreshold });
  }

  public onTempPassengers$(id: string): [Date, number] | undefined {
    return this.tempPassenger$.get(id);
  }

  public onTempECR$(id: string): [Date, number] | undefined {
    return this.tempECR$.get(id);
  }
}
