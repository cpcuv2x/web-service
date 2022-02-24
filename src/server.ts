import { PrismaClient, User } from "@prisma/client";
import { Configurations } from "./commons/Configurations";
import { RouteUtilities } from "./commons/RouteUtilities";
import { DBPolling } from "./components/DBPolling";
import { ExpressApp } from "./components/ExpressApp";
import { HttpServer } from "./components/HttpServer";
import { KafkaConsumer } from "./components/KafkaConsumer";
import { SocketIO } from "./components/SocketIO";
import { AuthRouter } from "./routes/auth/AuthRouter";
import { AuthServices } from "./routes/auth/AuthServices";
import { CarRouter } from "./routes/cars/CarRouter";
import { CarServices } from "./routes/cars/CarServices";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, "password">;
    }
  }
}

//#region Commons
const configurations = new Configurations();
const prismaClient = new PrismaClient();
const routeUtilities = new RouteUtilities({ configurations });

//#region Routes and Services
const authServices = new AuthServices({ configurations, prismaClient });
const authRouter = new AuthRouter({ routeUtilities, authServices });
const carServices = new CarServices({ prismaClient });
const carRouter = new CarRouter({ routeUtilities, carServices });
//#endregion

//#region Components
const expressApp = new ExpressApp({ routeUtilities, authRouter, carRouter });
const httpServer = new HttpServer({ configurations, expressApp });
const socketIO = new SocketIO({
  httpServer,
});
const kafkaConsumer = new KafkaConsumer({ configurations, socketIO });
const dbPolling = new DBPolling({ prismaClient, socketIO });
//#endregion

httpServer.listen$().subscribe((message) => {
  console.log(message);
});
