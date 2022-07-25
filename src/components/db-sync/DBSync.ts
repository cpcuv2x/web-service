import {
  CameraStatus,
  CarStatus,
  DriverStatus,
  ModuleStatus,
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
import { CarService } from "../services/cars/CarService";
import { DriverService } from "../services/drivers/DriverService";
import { LogService } from "../services/logs/LogService";
import { NotificiationService } from "../services/notifications/NotificationService";
import { CarStatusMessage, LocationMessage } from "../services/cars/interface"
import { Configurations } from "../commons/configurations/Configurations";

@injectable()
export class DBSync {
  private utilities: Utilities;
  private kafkaConsumer: KafkaConsumer;
  private carService: CarService;
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
    @inject(CarService) carService: CarService,
    @inject(DriverService) driverService: DriverService,
    @inject(CameraService) cameraService: CameraService,
    @inject(LogService) logService: LogService,
    @inject(NotificiationService) notificationServices: NotificiationService,
    @inject(Configurations) configurations: Configurations
  ) {
    this.utilities = utilities;
    this.kafkaConsumer = kafkaConsumer;
    this.carService = carService;
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
      await this.routineJob(activeTimestamp);

      //await this.kafkaConsumer.updateSenderVerifivation(this.driverService.getTempStatus(), this.carServices.getTempStatus());
    })

    // UTC time
    this.dailyCronJob = new CronJob('0 0 17 * * *', async () => {
      const activeTimestamp = new Date();
      activeTimestamp.setSeconds(activeTimestamp.getSeconds() - this.activeInterval);
      //Reset lat lng to be undefined
      await this.carService.reset(activeTimestamp);
      await this.routineJob(activeTimestamp);
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

  private async routineJob(activeTimestamp: Date) {
    await this.carService.updateInactiveCars(activeTimestamp);
    await this.carService.updateInactiveModules(activeTimestamp);
    await this.cameraService.updateInactiveCamera(activeTimestamp);
    await this.driverService.updateInactiveDrivers(activeTimestamp);

    await this.carService.updateTempPassengersAndPassengers(activeTimestamp);
    await this.driverService.updateECR(activeTimestamp);

    await this.carService.updateLocations();
    await this.carService.setUpTempStatus();
    await this.driverService.setUpTempStatus();
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
        if (carId != null && lat != null && lng != null && timestamp != null) {
          try {
            const carStatus = this.carService.getTempStatusWithID(carId)?.status;
            if (carStatus !== CarStatus.ACTIVE) {
              this.carService.setTempStatusWithID(carId, { status: CarStatus.ACTIVE, timestamp });
              this.carService.updateCar(carId, { status: CarStatus.ACTIVE, driverId, timestamp });
            }
          }
          catch (error) {
            console.log(error)
          }
          this.carService.setTempLocationsWithID(carId, { lat, lng, timestamp });

          if (driverId != null) {
            const driverStatus = this.driverService.getTempStatusWithID(driverId)?.status;
            try {
              if (driverStatus !== DriverStatus.ACTIVE) {
                this.driverService.setTempStatusWithID(driverId, { status: DriverStatus.ACTIVE, timestamp });
                this.driverService.updateDriver(driverId, { status: DriverStatus.ACTIVE, timestamp });
              }
            }
            catch (error) {
              console.log(error)
            }
          }
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
          this.carService.setTempPassengersWithID(carId, { passengers, timestamp });
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
        this.carService
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
        this.carService
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

        this.carService.setTempStatusWithID(carId, { status: CarStatus.ACTIVE, timestamp })
        if (driverId)
          this.driverService.setTempStatusWithID(driverId, { status: DriverStatus.ACTIVE, timestamp })

        this.carService
          .updateCar(carId, {
            status: CarStatus.ACTIVE,
            driverId: driverId,
            timestamp
          })
          .catch((error) => { })
        if (driverId)
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

        this.carService
          .updateModule(carId, ModuleRole.ACCIDENT_MODULE, {
            status: accidentModuleStatus === MessageDeviceStatus.ACTIVE ? ModuleStatus.ACTIVE : ModuleStatus.INACTIVE,
            timestamp
          })
          .catch(() => { })
        this.carService
          .updateModule(carId, ModuleRole.DROWSINESS_MODULE, {
            status: drowsinessModuleStatus === MessageDeviceStatus.ACTIVE ? ModuleStatus.ACTIVE : ModuleStatus.INACTIVE,
            timestamp
          })
          .catch(() => { })
      });
  }

  public onNotification$(): Observable<Notification> {
    return this.onNotificationSubject$;
  }

}


