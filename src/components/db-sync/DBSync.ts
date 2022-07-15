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
} from "rxjs";
import winston from "winston";
import { ModuleRole } from "../../enum/ModuleRole";
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
import { Status, Location } from "../services/cars/interface"
import { Configurations } from "../commons/configurations/Configurations";

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
  private minutelyCronJob: CronJob;
  private dailyCronJob: CronJob;
  private activeInterval: number;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(KafkaConsumer) kafkaConsumer: KafkaConsumer,
    @inject(CarServices) carServices: CarServices,
    @inject(DriverService) driverService: DriverService,
    @inject(CameraService) cameraService: CameraService,
    @inject(LogService) logService: LogService,
    @inject(NotificiationService) notificationServices: NotificiationService,
    @inject(Configurations) configurations: Configurations
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
    this.activeInterval = configurations.getConfig().activeInterval / 1000;

    this.minutelyCronJob = new CronJob('*/20 * * * * *', async () => {

      const activeTimestamp = new Date();
      activeTimestamp.setSeconds(activeTimestamp.getSeconds() - this.activeInterval);

      await this.carServices.updateInactiveCars(activeTimestamp);
      await this.carServices.updateInactiveModules(activeTimestamp);
      await this.cameraService.updateInactiveCamera(activeTimestamp);
      await this.driverService.updateInactiveDrivers(activeTimestamp);
      await this.carServices.updateTempPassengers(activeTimestamp);

      await this.carServices.updateLocations();
      await this.carServices.setUpTempStatus();
      await this.driverService.setUpTempStatus();
    })

    // UTC time
    this.dailyCronJob = new CronJob('0 0 17 * * *', async () => {
      await this.carServices.resetTempLocationsAndLocations();
    })

    if (!this.minutelyCronJob.running) {
      this.minutelyCronJob.start();
    }
    if (!this.dailyCronJob.running) {
      this.dailyCronJob.start();
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
        )
      )
      .subscribe((message) => {
        const { lat, lng, carId, timestamp, driverId } = message;
        if (carId != null && lat != null && lng != null && timestamp != null && driverId != null) {
          const carStatus = this.carServices.getTempStatusWithID(carId)?.status;
          const driverStatus = this.driverService.getTempStatusWithID(driverId)?.status;
          if ((carStatus == null || carStatus === CarStatus.INACTIVE) && (driverStatus == null || driverStatus === CarStatus.INACTIVE)) {
            this.carServices.incrementActiveCar();
            this.carServices.setTempStatusWithID(carId, { status: CarStatus.ACTIVE, timestamp });
            this.driverService.incrementActiveDriver();
            this.driverService.setTempStatusWithID(driverId, { status: DriverStatus.ACTIVE, timestamp });
          }
          this.carServices.setTempLocationsWithID(carId, { lat, lng, timestamp });
        }
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
        const { carId, passengers, timestamp } = message;
        if (carId != null && passengers != null && timestamp != null) {
          this.carServices.setTempPassengersWithID(carId, { passengers, timestamp });
        }
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

        const { driverId, ecr, ecrThreshold, timestamp } = message;

        if (driverId != null && ecrThreshold != null && ecr != null && timestamp != null) {
          if (this.driverService.getTempECRWithID(driverId)?.ecrThreshold !== ecrThreshold)
            this.driverService.updateDriver(driverId, { ecrThreshold: ecrThreshold });
          this.driverService.setTempECRWithID(driverId, { ecr, ecrThreshold, timestamp })
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
        const timestamp = message.timestamp!;
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

        this.carServices.setTempStatusWithID(carId, { status: CarStatus.ACTIVE, timestamp })
        this.carServices
          .updateCar(carId, {
            status: CarStatus.ACTIVE,
            driverId: driverId,
            timestamp
          })
          .catch((error) => { })
        this.driverService
          .updateDriver(driverId, {
            status: DriverStatus.ACTIVE,
            timestamp
          })
          .catch((error) => { });
        this.cameraService
          .updateCamera(cameraDriverId, {
            status:
              cameraDriverStatus === MessageDeviceStatus.ACTIVE
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
            timestamp
          })
          .catch((error) => { });
        this.cameraService
          .updateCamera(cameraDoorId, {
            status:
              cameraDoorStatus === MessageDeviceStatus.ACTIVE
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
            timestamp
          })
          .catch((error) => { });
        this.cameraService
          .updateCamera(cameraSeatsFrontId, {
            status:
              cameraSeatsFrontStatus === MessageDeviceStatus.ACTIVE
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
            timestamp
          })
          .catch((error) => { });
        this.cameraService
          .updateCamera(cameraSeatsBackId, {
            status:
              cameraSeatsBackStatus === MessageDeviceStatus.ACTIVE
                ? CameraStatus.ACTIVE
                : CameraStatus.INACTIVE,
            timestamp
          })
          .catch((error) => { });

        this.carServices
          .updateModule(carId, ModuleRole.ACCIDENT_MODULE, {
            status: accidentModuleStatus === MessageDeviceStatus.ACTIVE ? CarStatus.ACTIVE : CarStatus.INACTIVE,
            timestamp
          })
          .catch(() => { })
        this.carServices
          .updateModule(carId, ModuleRole.DROWSINESS_MODULE, {
            status: drowsinessModuleStatus === MessageDeviceStatus.ACTIVE ? CarStatus.ACTIVE : CarStatus.INACTIVE,
            timestamp
          })
          .catch(() => { })
      });
  }

  public onNotification$(): Observable<Notification> {
    return this.onNotificationSubject$;
  }

  public onTempPassengersWithID$(id: string): Message | undefined {
    return this.carServices.getTempPassengersWithID(id);
  }

  public onTempECRWithID$(id: string): Message | undefined {
    return this.driverService.getTempECRWithID(id);
  }

  public onTempStatusWithID$(id: string): Status | undefined {
    return this.carServices.getTempStatusWithID(id);
  }

  public onTempLocation$(): Map<string, Location> | undefined {
    return this.carServices.getTempLocations();
  }

}


