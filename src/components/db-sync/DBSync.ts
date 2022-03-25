import { inject, injectable } from "inversify";
import { filter, map, throttleTime } from "rxjs";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { EventMessageType } from "../kafka-consumer/enums";
import { KafkaConsumer } from "../kafka-consumer/KafkaConsumer";
import { CarServices } from "../services/cars/CarServices";

@injectable()
export class DBSync {
  private utilities: Utilities;
  private kafkaConsumer: KafkaConsumer;
  private carServices: CarServices;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(KafkaConsumer) kafkaConsumer: KafkaConsumer,
    @inject(CarServices) carServices: CarServices
  ) {
    this.utilities = utilities;
    this.kafkaConsumer = kafkaConsumer;
    this.carServices = carServices;

    this.logger = utilities.getLogger("db-sync");

    this.start();
    this.logger.info("constructed.");
  }

  private start() {
    // Experiments
    this.carServices.getCars({}).then((result) => {
      // TODO: Store subscriptions
      result.cars.forEach((car) => {
        this.kafkaConsumer
          .onMessage$()
          .pipe(
            filter(
              (message) =>
                message.type === EventMessageType.Location && message.carId === car.id
            ),
            throttleTime(30000)
          )
          .subscribe((json) => {
            this.logger.verbose(
              `called carServices.updateCar for ${json.carId} with lat ${json.lat} and long ${json.lng}.`
            );
            this.carServices.updateCar(json.carId!, {
              lat: json.lat,
              long: json.lng,
            });
          });
        this.kafkaConsumer
          .onMessage$()
          .pipe(
            filter(
              (message) =>
                message.type === EventMessageType.Passengers && message.carId === car.id
            ),
            throttleTime(30000)
          )
          .subscribe((json) => {
            this.logger.verbose(
              `called carServices.updateCar for ${json.carId} with passengers ${json.passengers}.`
            );
            this.carServices.updateCar(json.carId!, {
              passengers: json.passengers,
            });
          });
      });
    });
  }
}
