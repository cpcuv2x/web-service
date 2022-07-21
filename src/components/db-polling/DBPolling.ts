import { Car, Driver } from "@prisma/client";
import { CronJob } from "cron";
import { inject, injectable } from "inversify";
import { interval, Observable } from "rxjs";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { CarServices } from "../services/cars/CarService";
import { DriverService } from "../services/drivers/DriverService";
import { LogService } from "../services/logs/LogService";

@injectable()
export class DBPolling {
  private utilities: Utilities;
  private carServices: CarServices;
  private driverService: DriverService;
  private logService: LogService;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(CarServices) carServices: CarServices,
    @inject(DriverService) driverService: DriverService,
    @inject(LogService) logService: LogService
  ) {
    this.utilities = utilities;
    this.carServices = carServices;
    this.driverService = driverService;
    this.logService = logService;

    this.logger = utilities.getLogger("db-polling");

    this.logger.info("constructed.");
  }

  public pollCarInformation(carId: string): Observable<any> {
    return new Observable((observer) => {
      this.carServices
        .getCarById(carId)
        .then((car) => observer.next(car))
        .catch((error) => { });
      const subscription = interval(30000).subscribe(() => {
        this.carServices
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

  public pollActiveCars(): Observable<any> {
    return new Observable((observer) => {
      const result = this.carServices
        .getTempActiveCarsAndTempTotalCars();
      observer.next(result);

      const subscription = interval(500).subscribe(() => {
        const result = this.carServices
          .getTempActiveCarsAndTempTotalCars();
        observer.next(result)
      })

      return () => subscription.unsubscribe();
    });
  }

  public pollActiveDrivers(): Observable<any> {
    return new Observable((observer) => {
      this.driverService
        .getActiveDriversAndTotalCars()
        .then((result) => observer.next(result))
        .catch((error) => { });
      const activeDriversJob = new CronJob('0 * * * * *', async () => {
        this.driverService
          .getActiveDriversAndTotalCars()
          .then((result) => observer.next(result))
          .catch((error) => { });
      });

      if (!activeDriversJob.running) {
        activeDriversJob.start();
      }

      return () => activeDriversJob.stop();
    });
  }

  public pollTotalAccidentCount(): Observable<number> {
    return new Observable((observer) => {
      const result = this.logService.getTempTotalAccidentCount();
      observer.next(result ?? 0)

      const subscription = interval(30000).subscribe(() => {
        const result = this.logService.getTempTotalAccidentCount();
        observer.next(result ?? 0)
      });
      return () => subscription.unsubscribe();
    });
  }
  //FIXME Consider to change to be catch change to
  public pollHeartbeatStatus(): Observable<any> {
    return new Observable((observer) => {
      this.carServices
        .getCarsHeartbeat()
        .then((result) => observer.next(result))
        .catch((error) => { })

      const subscription = interval(2000).subscribe(() => {
        this.carServices
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
    return await this.carServices.getCarsLocation();
  }


  public pollOverviews() {

    const getOverviewResult = () => {
      const carsOverviewResult = this.carServices.getOverview();
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


}
