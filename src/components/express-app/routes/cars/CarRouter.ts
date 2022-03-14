import { randomBytes } from "crypto";
import express, { NextFunction, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import multer from "multer";
import path from "path";
import winston from "winston";
import { Utilities } from "../../../commons/utilities/Utilities";
import { CarServices } from "../../../services/cars/CarServices";
import {
  CreateCarDto,
  SearchCarsCriteriaQuery,
  UpdateCarDto,
} from "../../../services/cars/interfaces";
import { Request } from "../../interfaces";
import { RouteUtilities } from "../../RouteUtilities";
import { CarStatus } from "./enums";
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
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(createCarSchema),
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
          const car = await this.carServices.createCar(payload);
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
      this.routeUtilities.authenticateJWT(),
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
            if (req.query.status === CarStatus.Inactive) {
              payload = { ...payload, status: CarStatus.Inactive };
            } else {
              payload = { ...payload, status: CarStatus.Active };
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
        req: Request<{ id: string }, any, UpdateCarDto>,
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
     * /cars/{id}:
     *  patch:
     *    summary: Update a car.
     *    tags: [Cars]
     *    parameters:
     *      - $ref: '#/components/parameters/CarId'
     *    requestBody:
     *      required: true
     *      content:
     *        multipart/form-data:
     *          schema:
     *            $ref: '#/components/schemas/UpdateCarDto'
     *    responses:
     *      200:
     *        description: Returns the updated car.
     *      404:
     *        description: Car was not found.
     *      400:
     *        description: License plate exists.
     */
    this.router.patch(
      "/:id",
      upload.single("image"),
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(updateCarSchema),
      async (
        req: Request<{ id: string }, any, UpdateCarDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let payload: any = {
            ...req.body,
          };
          if (req.file) {
            const imageFilename = req.file.filename;
            payload = { ...payload, imageFilename };
          }
          const car = await this.carServices.updateCar(req.params.id, payload);
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
  }

  public getRouterInstance() {
    return this.router;
  }
}
