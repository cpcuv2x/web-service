import { InfluxDB } from "@influxdata/influxdb-client";
import { PrismaClient } from "@prisma/client";
import { Container } from "inversify";
import "reflect-metadata";
import { Configurations } from "./components/commons/configurations/Configurations";
import { Utilities } from "./components/commons/utilities/Utilities";
import { DBPolling } from "./components/db-polling/DBPolling";
import { DBSync } from "./components/db-sync/DBSync";
import { ExpressApp } from "./components/express-app/ExpressApp";
import { AuthRouter } from "./components/express-app/routes/auth/AuthRouter";
import { CameraRouter } from "./components/express-app/routes/cameras/CameraRouter";
import { CarRouter } from "./components/express-app/routes/cars/CarRouter";
import { DriverRouter } from "./components/express-app/routes/drivers/DriverRouter";
import { NotificationRouter } from "./components/express-app/routes/notifications/NotificationRouter";
import { RouteUtilities } from "./components/express-app/RouteUtilities";
import { HttpServer } from "./components/http-server/HttpServer";
import { KafkaConsumer } from "./components/kafka-consumer/KafkaConsumer";
import { AuthService } from "./components/services/auth/AuthService";
import { CameraService } from "./components/services/cameras/CameraService";
import { CarServices } from "./components/services/cars/CarService";
import { DriverService } from "./components/services/drivers/DriverService";
import { LogService } from "./components/services/logs/LogService";
import { NotificiationService } from "./components/services/notifications/NotificationService";
import { SocketIO } from "./components/socket-io/SocketIO";

const container = new Container();
container.bind(Utilities).toSelf().inSingletonScope();
container.bind(Configurations).toSelf().inSingletonScope();
const configurations = container.get(Configurations);
container.bind("prisma-client").toConstantValue(new PrismaClient());
container.bind("influx-client").toConstantValue(
  new InfluxDB({
    url: configurations.getConfig().influx.host,
    token: configurations.getConfig().influx.token,
  })
);
container.bind(AuthService).toSelf().inSingletonScope();
container.bind(CarServices).toSelf().inSingletonScope();
container.bind(DriverService).toSelf().inSingletonScope();
container.bind(CameraService).toSelf().inSingletonScope();
container.bind(NotificiationService).toSelf().inSingletonScope();
container.bind(LogService).toSelf().inSingletonScope();
container.bind(RouteUtilities).toSelf().inSingletonScope();
container.bind(AuthRouter).toSelf().inSingletonScope();
container.bind(CarRouter).toSelf().inSingletonScope();
container.bind(DriverRouter).toSelf().inSingletonScope();
container.bind(NotificationRouter).toSelf().inSingletonScope();
container.bind(CameraRouter).toSelf().inSingletonScope();
container.bind(ExpressApp).toSelf().inSingletonScope();
container.bind(HttpServer).toSelf().inSingletonScope();
container.bind(KafkaConsumer).toSelf().inSingletonScope();
container.bind(DBPolling).toSelf().inSingletonScope();
container.bind(DBSync).toSelf().inSingletonScope();
container.bind(SocketIO).toSelf().inSingletonScope();

// These components are root components.
container.get(SocketIO);
container.get(DBSync);
