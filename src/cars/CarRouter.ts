import express, { NextFunction, Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { RouteUtilities } from "../commons/RouteUtilities";
import { CarServices } from "./CarServices";
import { CreateCarDto, UpdateCarDto } from "./interface";

interface CarRouterDependencies {
  carServices: CarServices;
  routeUtilities: RouteUtilities;
}

export class CarRouter {
  private dependencies: CarRouterDependencies;

  private router!: Router;

  constructor(dependencies: CarRouterDependencies) {
    this.dependencies = dependencies;
    this.instanciateRouter();
  }

  private instanciateRouter() {
    const { routeUtilities, carServices } = this.dependencies;

    this.router = express.Router();

    this.router.post(
      "/",
      routeUtilities.authenticateJWT,
      async (
        req: Request<any, any, CreateCarDto>,
        res: Response,
        next: NextFunction
      ) => {
        const car = await carServices.createCar(req.body);
        res.status(StatusCodes.OK).send(car);
      }
    );

    this.router.get(
      "/",
      routeUtilities.authenticateJWT,
      async (req: Request, res: Response, next: NextFunction) => {
        const cars = await carServices.getAllCars();
        res.status(StatusCodes.OK).send(cars);
      }
    );

    this.router.get(
      "/:id",
      routeUtilities.authenticateJWT,
      async function (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
      ) {
        try {
          const car = await carServices.getCarById(req.params.id);
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.patch(
      "/:id",
      routeUtilities.authenticateJWT,
      async (
        req: Request<{ id: string }, any, UpdateCarDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const car = await carServices.updateCar(req.params.id, req.body);
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.delete(
      "/:id",
      routeUtilities.authenticateJWT,
      async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const car = await carServices.deleteCar(req.params.id);
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  public getRouterInstance() {
    return this.router;
  }
}
