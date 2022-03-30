import { inject, injectable } from "inversify";
import { interval, Observable } from "rxjs";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { CarServices } from "../services/cars/CarService";
import { DriverService } from "../services/drivers/DriverService";

@injectable()
export class DBPolling {
  private utilities: Utilities;
  private carServices: CarServices;
  private driverService: DriverService;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(CarServices) carServices: CarServices,
    @inject(DriverService) driverService: DriverService
  ) {
    this.utilities = utilities;
    this.carServices = carServices;
    this.driverService = driverService;

    this.logger = utilities.getLogger("db-polling");

    this.logger.info("constructed.");
  }

  public pollCarInformation(carId: string): Observable<any> {
    return new Observable((observer) => {
      const subscription = interval(30000).subscribe(() => {
        this.carServices
          .getCarById(carId)
          .then((car) => observer.next(car))
          .catch((error) => {});
      });
      return () => subscription.unsubscribe();
    });
  }

  public pollActiveCars(): Observable<any> {
    return new Observable((observer) => {
      const subscription = interval(30000).subscribe(() => {
        this.carServices
          .getActiveCars()
          .then((result) => observer.next(result));
      });
      return () => subscription.unsubscribe();
    });
  }

  public pollActiveDrivers(): Observable<any> {
    return new Observable((observer) => {
      const subscription = interval(30000).subscribe(() => {
        this.driverService
          .getActiveDrivers()
          .then((result) => observer.next(result));
      });
    });
  }

  public pollTotalPassengers(): Observable<number> {
    return new Observable((observer) => {
      const subscription = interval(30000).subscribe(() => {
        this.carServices
          .getTotalPassengers()
          .then((result) => observer.next(result ?? 0));
      });
    });
  }
}
