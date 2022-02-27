import { randomBytes } from "crypto";
import express, { NextFunction, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import isEmpty from "lodash/isEmpty";
import multer from "multer";
import path from "path";
import { Request } from "../../commons/interfaces";
import { RouteUtilities } from "../../commons/RouteUtilities";
import { CarServices } from "./CarServices";
import { CarStatus } from "./enums";
import {
  CreateCarDto,
  SearchCarsCriteriaQuery,
  UpdateCarDto,
} from "./interfaces";
import { createCarSchema } from "./schemas";

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

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, ".images");
      },
      filename: (req, file, cb) => {
        const filename =
          randomBytes(16).toString("hex") + path.extname(file.originalname);
        cb(null, filename);
      },
    });
    const upload = multer({ storage });

    /**
     * @swagger
     * /cars:
     *  post:
     *    summary: Register a new car.
     *    tags: [Cars]
     *    requestBody:
     *      required: true
     *      content:
     *        multipart/form-data:
     *          schema:
     *            $ref: '#/components/schemas/CreateCarDto'
     *    responses:
     *      200:
     *        description: Returns the created car.
     *      400:
     *        description: License plate exists.
     */
    this.router.post(
      "/",
      upload.single("image"),
      routeUtilities.authenticateJWT(),
      routeUtilities.validateSchema(createCarSchema),
      async (
        req: Request<any, any, CreateCarDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let imageFilename = "";
          if (req.file) {
            imageFilename = req.file.filename;
          }
          const payload = {
            ...req.body,
            imageFilename,
          };
          const car = await carServices.createCar(payload);
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cars/images/{filename}:
     *  get:
     *    summary: Get the image of the car.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarImageFilename'
     *    responses:
     *      200:
     *        content:
     *          image/*:
     *            schema:
     *              type: string
     *              format: binary
     *      404:
     *        description: Image was not found.
     */
    this.router.use(
      "/images",
      routeUtilities.authenticateJWT(),
      express.static(".images")
    );

    /**
     * @swagger
     * /cars:
     *  get:
     *    summary: Get a list of cars.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/SearchCarsCriteriaLicensePlate'
     *      - $ref: '#/components/parameters/SearchCarsCriteriaModel'
     *      - $ref: '#/components/parameters/SearchCarsCriteriaImageFilename'
     *      - $ref: '#/components/parameters/SearchCarsCriteriaStatus'
     *      - $ref: '#/components/parameters/SearchCarsCriteriaMinPassengers'
     *      - $ref: '#/components/parameters/SearchCarsCriteriaMaxPassengers'
     *      - $ref: '#/components/parameters/SearchCarsCriteriaLimit'
     *      - $ref: '#/components/parameters/SearchCarsCriteriaOffset'
     *      - $ref: '#/components/parameters/SearchCarsCriteriaOrderBy'
     *      - $ref: '#/components/parameters/SearchCarsCriteriaOrderDir'
     *    responses:
     *      200:
     *        description: Returns a list of cars and total
     *      400:
     *        description: Bad Request.
     */
    this.router.get(
      "/",
      routeUtilities.authenticateJWT(),
      async (
        req: Request<any, any, any, SearchCarsCriteriaQuery>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let licensePlate = undefined;
          if (!isEmpty(req.query.licensePlate)) {
            licensePlate = req.query.licensePlate;
          }

          let model = undefined;
          if (!isEmpty(req.query.model)) {
            model = req.query.model;
          }

          let imageFilename = undefined;
          if (!isEmpty(req.query.imageFilename)) {
            imageFilename = req.query.imageFilename;
          }

          let status = undefined;
          if (!isEmpty(req.query.status)) {
            if (req.query.status === CarStatus.Inactive) {
              status = CarStatus.Inactive;
            } else {
              status = CarStatus.Active;
            }
          }

          let minPassengers = undefined;
          if (!isEmpty(req.query.minPassengers)) {
            minPassengers = parseInt(req.query.minPassengers!);
          }

          let maxPassengers = undefined;
          if (!isEmpty(req.query.maxPassengers)) {
            maxPassengers = parseInt(req.query.maxPassengers!);
          }

          let limit = 0;
          if (!isEmpty(req.query.limit)) {
            limit = parseInt(req.query.limit!);
          }

          let offset = 0;
          if (!isEmpty(req.query.offset)) {
            offset = parseInt(req.query.offset!);
          }

          let orderBy = "id";
          if (!isEmpty(req.query.orderBy)) {
            orderBy = req.query.orderBy!;
          }

          let orderDir = "asc" as "asc" | "desc";
          if (req.query.orderDir === "desc") {
            orderDir = "desc";
          }

          const payload = {
            licensePlate,
            model,
            imageFilename,
            status,
            minPassengers,
            maxPassengers,
            limit,
            offset,
            orderBy,
            orderDir,
          };

          const result = await carServices.getCars(payload);

          res.status(StatusCodes.OK).send(result);
        } catch (error) {
          next(error);
        }
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
