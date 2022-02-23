import cookieParser from "cookie-parser";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { AuthRouter } from "../auth/AuthRouter";
import { CarRouter } from "../cars/CarRouter";
import { RouteUtilities } from "../commons/RouteUtilities";

interface ExpressAppDependencies {
  routeUtilities: RouteUtilities;
  authRouter: AuthRouter;
  carRouter: CarRouter;
}

export class ExpressApp {
  private dependencies: ExpressAppDependencies;

  private app!: express.Express;

  constructor(dependencies: ExpressAppDependencies) {
    this.dependencies = dependencies;

    this.instanciateExpressApp();
  }

  private instanciateExpressApp() {
    const { routeUtilities, authRouter, carRouter } = this.dependencies;

    this.app = express();

    this.app.use(express.json());
    this.app.use(cookieParser());

    this.app.use("/auth", authRouter.getRouterInstance());
    this.app.use("/cars", carRouter.getRouterInstance());

    this.app.use(routeUtilities.errorHandling());

    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(routeUtilities.getSwaggerSpec())
    );
  }

  public getExpressAppInstance(): express.Express {
    return this.app;
  }
}
