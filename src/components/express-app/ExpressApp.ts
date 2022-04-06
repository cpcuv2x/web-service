import cookieParser from "cookie-parser";
import express from "express";
import { inject, injectable } from "inversify";
import swaggerUi from "swagger-ui-express";
import winston from "winston";
import { Utilities } from "../commons/utilities/Utilities";
import { AuthRouter } from "./routes/auth/AuthRouter";
import { CarRouter } from "./routes/cars/CarRouter";
import { DriverRouter } from "./routes/drivers/DriverRouter";
import { NotificationRouter } from "./routes/notifications/NotificationRouter";
import { RouteUtilities } from "./RouteUtilities";

@injectable()
export class ExpressApp {
  private utilities: Utilities;
  private routeUtilities: RouteUtilities;
  private authRouter: AuthRouter;
  private carRouter: CarRouter;
  private driverRouter: DriverRouter;
  private notificationRouter: NotificationRouter;

  private logger: winston.Logger;

  private app!: express.Express;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(RouteUtilities) routeUtilities: RouteUtilities,
    @inject(AuthRouter) authRouter: AuthRouter,
    @inject(CarRouter) carRouter: CarRouter,
    @inject(DriverRouter) driverRouter: DriverRouter,
    @inject(NotificationRouter) notificationRouter: NotificationRouter
  ) {
    this.utilities = utilities;
    this.routeUtilities = routeUtilities;
    this.authRouter = authRouter;
    this.carRouter = carRouter;
    this.driverRouter = driverRouter;
    this.notificationRouter = notificationRouter;

    this.logger = utilities.getLogger("express-app");

    this.instantiate();

    this.logger.info("constructed.");
  }

  private instantiate() {
    this.app = express();

    this.app.use(express.json());
    this.app.use(cookieParser());

    this.app.use("/auth", this.authRouter.getRouterInstance());
    this.app.use("/cars", this.carRouter.getRouterInstance());
    this.app.use("/drivers", this.driverRouter.getRouterInstance());
    this.app.use("/notifications", this.notificationRouter.getRouterInstance());

    this.app.use(this.routeUtilities.errorHandling());

    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(this.routeUtilities.getSwaggerSpec())
    );
  }

  public getExpressAppInstance(): express.Express {
    return this.app;
  }
}
