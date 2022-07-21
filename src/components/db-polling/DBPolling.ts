import { CronJob } from "cron";
import { inject, injectable } from "inversify";
import { interval, Observable } from "rxjs";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { CarService } from "../services/cars/CarService";
import { PassengersMessage } from "../services/cars/interface";
import { DriverService } from "../services/drivers/DriverService";
import { ECRMessage } from "../services/drivers/interface";
import { LogService } from "../services/logs/LogService";

@injectable()
export class DBPolling {
  private utilities: Utilities;
  private carService: CarService;
  private driverService: DriverService;
  private logService: LogService;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(CarService) carService: CarService,
    @inject(DriverService) driverService: DriverService,
    @inject(LogService) logService: LogService
  ) {
    this.utilities = utilities;
    this.carService = carService;
    this.driverService = driverService;
    this.logService = logService;

    this.logger = utilities.getLogger("db-polling");

    this.logger.info("constructed.");
  }

  public pollCarInformation(carId: string): Observable<any> {
    return new Observable((observer) => {
      this.carService
        .getCarById(carId)
        .then((car) => observer.next(car))
        .catch((error) => { });
      const subscription = interval(30000).subscribe(() => {
        this.carService
          .getCarById(carId)
          .then((car) => observer.next(car))
          .catch((error) => { });
      });
      return () => subscription.unsubscribe();
    });
  }

  public pollDriverInformation(driverId: string): Observable<any> {
    return new Observable((observer) => {
      this.driverService
        .getDriverById(driverId)
        .then((driver) => observer.next(driver))
        .catch((error) => { });
      const subscription = interval(30000).subscribe(() => {
        this.driverService
          .getDriverById(driverId)
          .then((driver) => observer.next(driver))
          .catch((error) => { });
      });
      return () => subscription.unsubscribe();
    });
  }

  public pollHeartbeatStatus(): Observable<any> {
    return new Observable((observer) => {
      this.carService
        .getCarsHeartbeat()
        .then((result) => observer.next(result))
        .catch((error) => { })

      const subscription = interval(2000).subscribe(() => {
        this.carService
          .getCarsHeartbeat()
          .then((result) => { observer.next(result) })
          .catch((error) => { })
      });
      return () => subscription.unsubscribe();
    });
  }

  public async pollECRThreshold(driverID: string) {
    return await this.driverService.getDriverById(driverID);
  }

  public async pollCarsLocation() {
    return await this.carService.getCarsLocation();
  }


  public pollOverviews() {

    const getOverviewResult = () => {
      const carsOverviewResult = this.carService.getOverview();
      const driversOverviewResult = this.driverService.getTempActiveDriversAndTempTotalDriversForOverview();
      const accidentOverviewResult = this.logService.getTempTotalAccidentCountForOverview()
      return { ...carsOverviewResult, ...driversOverviewResult, ...accidentOverviewResult }
    }

    return new Observable((observer) => {
      const result = getOverviewResult();
      observer.next(result)

      const subscription = interval(500).subscribe(() => {
        const result = getOverviewResult();
        observer.next(result)
      });
      return () => subscription.unsubscribe();
    });
  }

  public pollCronedPassengersWithID(carID: string): Observable<PassengersMessage> {
    return new Observable((observer) => {
      const activeDriversJob = new CronJob('0 * * * * *', async () => {
        const message = this.carService.getTempPassengersWithID(carID);
        let time = new Date();
        if (message != null && time.getTime() - message.timestamp!.getTime() <= 60000) {
          let { passengers, timestamp } = message;
          timestamp = setZeroSecondsAndMilliseconds(timestamp!);
          observer.next({ passengers, timestamp });
        }
        else {
          time.setMinutes(time.getMinutes() - 1);
          time = setZeroSecondsAndMilliseconds(time);
          observer.next({ passengers: 0, timestamp: time });
        }
      });

      if (!activeDriversJob.running) {
        activeDriversJob.start();
      }

      return () => activeDriversJob.stop();
    });
  }

  public pollCronedECRsWithID(driverId: string): Observable<ECRMessage> {
    return new Observable((observer) => {
      const activeDriversJob = new CronJob('0 * * * * *', async () => {
        const message = this.driverService.getTempECRWithID(driverId);
        let time = new Date();
        if (message != null && time.getTime() - message.timestamp!.getTime() <= 60000) {
          let { ecr, ecrThreshold, timestamp } = message;
          timestamp = setZeroSecondsAndMilliseconds(timestamp!);
          observer.next({ ecr, ecrThreshold, timestamp });
        }
        else {
          const ecrThreshold = this.driverService.getTempECRWithID(driverId)?.ecrThreshold;
          time.setMinutes(time.getMinutes() - 1);
          time = setZeroSecondsAndMilliseconds(time);
          observer.next(
            {
              ecr: 0,
              ecrThreshold: ecrThreshold != null ? ecrThreshold : 1,
              timestamp: time
            }
          );
        }
      });

      if (!activeDriversJob.running) {
        activeDriversJob.start();
      }

      return () => activeDriversJob.stop();
    });
  }

}

const setZeroSecondsAndMilliseconds = (timestamp: Date) => {
  const temp = new Date(timestamp);
  temp.setSeconds(0);
  temp.setMilliseconds(0);
  return temp;
}
