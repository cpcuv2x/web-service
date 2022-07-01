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
      this.carServices
        .getActiveCars()
        .then((result) => observer.next(result))
        .catch((error) => { });
      const subscription = interval(30000).subscribe(() => {
        this.carServices
          .getActiveCars()
          .then((result) => observer.next(result))
          .catch((error) => { });
      });
      return () => subscription.unsubscribe();
    });
  }

  public pollActiveDrivers(): Observable<any> {
    return new Observable((observer) => {
      this.driverService
        .getActiveDrivers()
        .then((result) => observer.next(result))
        .catch((error) => { });
      const subscription = interval(30000).subscribe(() => {
        this.driverService
          .getActiveDrivers()
          .then((result) => observer.next(result))
          .catch((error) => { });
      });
      return () => subscription.unsubscribe();
    });
  }

  //FIXME Interface
  public pollTotalPassengers(): Observable<any> {
    return new Observable((observer) => {
      this.carServices
        .getPassengersOfCars()
        .then((result) => {
          observer.next(result ?? { totalPassengers: 0 })
        })
        .catch((error) => { });

      const totalPassengersJob = new CronJob('0 * * * * *', async () => {
        this.carServices
          .getPassengersOfCars()
          .then((result) => {
            observer.next(result ?? { totalPassengers: 0 })
          })
          .catch((error) => { });
      });

      if (!totalPassengersJob.running) {
        totalPassengersJob.start();
      }

      return () => { totalPassengersJob.stop() };
    });
  }

  public pollTotalAccidentCount(): Observable<number> {
    return new Observable((observer) => {
      this.logService
        .getTotalAccidentCount()
        .then((result) => observer.next(result ?? 0))
        .catch((error) => { });
      const subscription = interval(30000).subscribe(() => {
        this.logService
          .getTotalAccidentCount()
          .then((result) => observer.next(result ?? 0))
          .catch((error) => { });
      });
      return () => subscription.unsubscribe();
    });
  }

  public pollHeartbeatStatus(): Observable<any> {
    return new Observable((observer) => {
      this.carServices
        .getCarsHeartbeat()
        .then((result) => observer.next(result))
        .catch((error) => { })

      const subscription = interval(10000).subscribe(() => {
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
    const locationOfCars = await this.carServices.getLocationOfCars();
    return locationOfCars
  }
}
