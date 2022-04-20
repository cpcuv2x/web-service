import { CarStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import express, { NextFunction, Response, Router } from "express";
import fs from "fs";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import multer from "multer";
import path from "path";
import winston from "winston";
import { Utilities } from "../../../commons/utilities/Utilities";
import { CarServices } from "../../../services/cars/CarService";
import { Request } from "../../interfaces";
import { RouteUtilities } from "../../RouteUtilities";
import {
  CreateCarDto,
  GetCarAccidentLogsCriteriaQuery,
  GetPassengerInfluxQuery,
  SearchCarsCriteriaQuery,
  UpdateCarDto,
} from "./interfaces";
import { createCarSchema, updateCarSchema } from "./schemas";

@injectable()
export class CarRouter {
  private utilities: Utilities;
  private carServices: CarServices;
  private routeUtilities: RouteUtilities;

  private logger: winston.Logger;

  private router!: Router;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(CarServices) carServices: CarServices,
    @inject(RouteUtilities) routeUtilities: RouteUtilities
  ) {
    this.utilities = utilities;
    this.carServices = carServices;
    this.routeUtilities = routeUtilities;

    this.logger = utilities.getLogger("car-router");

    this.instanciateRouter();

    this.logger.info("constructed.");
  }

  private instanciateRouter() {
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
     *        application/json:
     *          schema:
     *            $ref: '#/components/schemas/CreateCarDto'
     *    responses:
     *      200:
     *        description: Returns the created car.
     *      500:
     *        description: Cannot create car.
     */
    this.router.post(
      "/",
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(createCarSchema),
      async (
        req: Request<any, any, CreateCarDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const car = await this.carServices.createCar(req.body);
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cars/{id}/image:
     *  patch:
     *    summary: Update the image of the car.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarId'
     *    requestBody:
     *      required: true
     *      content:
     *        multipart/form-data:
     *          schema:
     *            $ref: '#/components/schemas/UpdateCarImageDto'
     *    responses:
     *      200:
     *        description: Returns the updated car.
     *      404:
     *        description: Car was not found.
     */
    this.router.patch(
      "/:id/image",
      upload.single("image"),
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let imageFilename = "";
          if (req.file) {
            imageFilename = req.file.filename;
          }
          const oldImageFilename = (
            await this.carServices.getCarById(req.params.id)
          ).imageFilename;
          try {
            fs.unlinkSync(path.join(".images", oldImageFilename));
          } catch (error) {}
          const car = await this.carServices.updateCar(req.params.id, {
            imageFilename,
          });
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @deprecated
     * @swagger
     * /cars/images/{filename}:
     *  get:
     *    deprecated: true
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
      this.routeUtilities.authenticateJWT(),
      express.static(".images")
    );

    /**
     * @swagger
     * /cars/{id}/image:
     *  get:
     *    summary: Get the image of the car.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarId'
     *    responses:
     *      200:
     *        content:
     *          image/*:
     *            schema:
     *              type: string
     *              format: binary
     *      404:
     *         description: Car was not found.
     *      500:
     *         description: Cannot get image.
     */
    this.router.get(
      "/:id/image",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const car = await this.carServices.getCarById(req.params.id);
          res.sendFile(path.join(".images", car.imageFilename), {
            root: process.cwd(),
          });
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cars/{id}/image:
     *  delete:
     *    summary: Delete the image of the car.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarId'
     *    responses:
     *      200:
     *        description: Returns the updated car.
     *      404:
     *        description: Car was not found.
     */
    this.router.delete(
      "/:id/image",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const oldImageFilename = (
            await this.carServices.getCarById(req.params.id)
          ).imageFilename;
          try {
            fs.unlinkSync(path.join(".images", oldImageFilename));
          } catch (error) {}
          const car = await this.carServices.updateCar(req.params.id, {
            imageFilename: "",
          });
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
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
     *      500:
     *        description: Cannot get a list of cars.
     */
    this.router.get(
      "/",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<any, any, any, SearchCarsCriteriaQuery>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let payload = {};
          if (!isEmpty(req.query.licensePlate)) {
            payload = { ...payload, licensePlate: req.query.licensePlate };
          }
          if (!isEmpty(req.query.model)) {
            payload = { ...payload, model: req.query.model };
          }
          if (!isEmpty(req.query.imageFilename)) {
            payload = { ...payload, imageFilename: req.query.imageFilename };
          }
          if (!isEmpty(req.query.status)) {
            if (req.query.status === CarStatus.INACTIVE) {
              payload = { ...payload, status: CarStatus.INACTIVE };
            } else {
              payload = { ...payload, status: CarStatus.ACTIVE };
            }
          }
          if (!isEmpty(req.query.minPassengers)) {
            payload = {
              ...payload,
              minPassengers: parseInt(req.query.minPassengers!),
            };
          }
          if (!isEmpty(req.query.maxPassengers)) {
            payload = {
              ...payload,
              maxPassengers: parseInt(req.query.maxPassengers!),
            };
          }
          if (!isEmpty(req.query.limit)) {
            payload = { ...payload, limit: parseInt(req.query.limit!) };
          }
          if (!isEmpty(req.query.offset)) {
            payload = { ...payload, offset: parseInt(req.query.offset!) };
          }
          if (!isEmpty(req.query.orderBy)) {
            payload = { ...payload, orderBy: req.query.orderBy! };
          }
          if (!isEmpty(req.query.orderDir)) {
            if (req.query.orderDir === "desc") {
              payload = { ...payload, orderDir: "desc" };
            } else {
              payload = { ...payload, orderDir: "asc" };
            }
          }

          const result = await this.carServices.getCars(payload);

          res.status(StatusCodes.OK).send(result);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cars/{id}:
     *  get:
     *    summary: Get the specific car by ID.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarId'
     *    responses:
     *      200:
     *        description: Returns the specific car.
     *      404:
     *        description: Car was not found.
     */
    this.router.get(
      "/:id",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const car = await this.carServices.getCarById(req.params.id);
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cars/{id}/passengers:
     *  get:
     *    summary: Get the passenger log of a car.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarId'
     *      - $ref: '#/components/parameters/GetPassengerInfluxQueryStartTime'
     *      - $ref: '#/components/parameters/GetPassengerInfluxQueryEndTime'
     *      - $ref: '#/components/parameters/GetPassengerInfluxQueryAggregate'
     *    responses:
     *      200:
     *        description: Returns passenger log of the car.
     *      404:
     *        description: Car was not found.
     */
    this.router.get(
      "/:id/passengers",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }, any, any, GetPassengerInfluxQuery>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let passengerQuery = {
            startTime:
              (req.query.startTime as string) || "1970-01-01T00:00:00Z",
            endTime: (req.query.endTime as string) || "",
            aggregate:
              (req.query.aggregate as unknown as string) === "true"
                ? true
                : false,
          };
          const passengerResult = await this.carServices.getPassengersInflux(
            req.params.id,
            passengerQuery
          );
          res.status(StatusCodes.OK).send(passengerResult);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cars/{id}:
     *  patch:
     *    summary: Update a car.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarId'
     *    requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            $ref: '#/components/schemas/UpdateCarDto'
     *    responses:
     *      200:
     *        description: Returns the updated car.
     *      404:
     *        description: Car was not found.
     *      500:
     *        description: Cannot update car.
     */
    this.router.patch(
      "/:id",
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(updateCarSchema),
      async (
        req: Request<{ id: string }, any, UpdateCarDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const car = await this.carServices.updateCar(req.params.id, req.body);
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cars/{id}:
     *  delete:
     *    summary: Delete a car.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarId'
     *    responses:
     *      200:
     *        description: Returns the deleted car.
     *      404:
     *        description: Car was not found.
     */
    this.router.delete(
      "/:id",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const car = await this.carServices.deleteCar(req.params.id);
          res.status(StatusCodes.OK).send(car);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cars/{id}/accidents:
     *  get:
     *    summary: Get the accident logs of the car by specific date range.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarId'
     *      - $ref: '#/components/parameters/GetCarAccidentLogsCriteriaStartTime'
     *      - $ref: '#/components/parameters/GetCarAccidentLogsCriteriaEndTime'
     *    responses:
     *      200:
     *        description: Returns the accident logs of the car by specific date range.
     */
    this.router.get(
      "/:id/accidents",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }, any, any, GetCarAccidentLogsCriteriaQuery>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const payload: any = { carId: req.params.id };

          if (!isEmpty(req.query.startTime)) {
            payload.startTime = new Date(req.query.startTime!);
          }
          if (!isEmpty(req.query.endTime)) {
            payload.endTime = new Date(req.query.endTime!);
          }

          const logs = await this.carServices.getCarAccidentLogs(payload);

          res.status(StatusCodes.OK).send(logs);
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
