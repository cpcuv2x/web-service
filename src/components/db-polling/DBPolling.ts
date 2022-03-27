import { inject, injectable } from "inversify";
import { interval, Observable } from "rxjs";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { CarServices } from "../services/cars/CarService";

@injectable()
export class DBPolling {
  private utilities: Utilities;
  private carServices: CarServices;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(CarServices) carServices: CarServices
  ) {
    this.utilities = utilities;
    this.carServices = carServices;

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
}
