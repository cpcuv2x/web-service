import {
  CameraStatus,
  CarStatus,
  DriverStatus,
  Notification
} from "@prisma/client";
import { CronJob } from "cron";
import { inject, injectable } from "inversify";
import {
  filter,
  Observable,
  Subject,
  throttleTime,
} from "rxjs";
import winston from "winston";
import { ModuleRole } from "../../enum/ModuleRole";
import { Status } from "../../enum/Status";
import { Utilities } from "../commons/utilities/Utilities";
import {
  MessageDeviceStatus,
  MessageKind,
  MessageType
} from "../kafka-consumer/enums";
import { Message } from "../kafka-consumer/interfaces";
import { KafkaConsumer } from "../kafka-consumer/KafkaConsumer";
import { CameraService } from "../services/cameras/CameraService";
import { CarServices } from "../services/cars/CarService";
import { DriverService } from "../services/drivers/DriverService";
import { LogService } from "../services/logs/LogService";
import { NotificiationService } from "../services/notifications/NotificationService";
import { location } from "./interface"

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
  private tempPassenger$: Map<string, Message>;
  private tempECR$: Map<string, Message>;
  private tempLocations$: Map<string, location>;
  private tempStatus$: Map<string, CarStatus>;

  private cronJob: CronJob;

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
    this.tempPassenger$ = new Map<string, Message>();
    this.tempECR$ = new Map<string, Message>();
    this.tempLocations$ = new Map<string, location>();
    this.tempStatus$ = new Map<string, CarStatus>();

    this.cronJob = new CronJob('0 * * * * *', async () => {

      const activeTimestamp = new Date();
      activeTimestamp.setSeconds(activeTimestamp.getSeconds() - 80);

      await this.carServices.updateInactiveCars(activeTimestamp)
      await this.carServices.updateInactiveModules(activeTimestamp);
      await this.carServices.updateLocations(this.tempLocations$);
      await this.driverService.updateInactiveDrivers(activeTimestamp);

      await this.carServices.getCarsHeartbeat()
        .then(res => {
          res.forEach((element) => {
            this.tempStatus$.set(element.id, element.status);
          })
        })

    })

    if (!this.cronJob.running) {
      this.cronJob.start();
    }

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
        const { lat, lng } = message;
        if (message.carId != null && lat != null && lng != null)
          this.tempLocations$.set(message.carId, { lat, lng });
      });

    this.kafkaConsumer
      .onMessage$()
      .pipe(
        filter(
          (message) =>
            message.type === MessageType.Metric &&
            message.kind === MessageKind.CarPassengers
        )
      )
      .subscribe((message) => {

        const carId = message.carId;
        const passengers = message.passengers;
        message.timestamp = new Date();
        const timestamp = message.timestamp;

        if (carId != null && timestamp != null && passengers != null)
          this.tempPassenger$.set(carId, message);

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
        message.timestamp = new Date();
        const timestamp = message.timestamp;

        if (driverId != null && ecrThreshold != null && ecr != null && timestamp != null) {
          if (this.tempECR$.get(driverId!)?.ecrThreshold !== ecrThreshold)
            this.driverService.updateDriver(driverId!, { ecrThreshold: ecrThreshold });
          this.tempECR$.set(driverId, message)
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
          .catch((error) => { })
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

  public onTempPassengers$(id: string): Message | undefined {
    return this.tempPassenger$.get(id);
  }

  public onTempECR$(id: string): Message | undefined {
    return this.tempECR$.get(id);
  }
  public onTempStatus$(id: string): CarStatus | undefined {
    return this.tempStatus$.get(id);
  }
}

