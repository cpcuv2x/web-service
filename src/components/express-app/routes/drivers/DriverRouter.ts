import { randomBytes } from "crypto";
import express, { NextFunction, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import multer from "multer";
import path from "path";
import winston from "winston";
import { Utilities } from "../../../commons/utilities/Utilities";
import { DriverServices } from "../../../services/driver/DriverServices";
import {
  CreateDriverDto,
  SearchDriversCriteriaQuery,
  UpdateDriverDto,
} from "../../../services/driver/interfaces";
import { Request } from "../../interfaces";
import { RouteUtilities } from "../../RouteUtilities";
import { createDriverSchema, updateDriverSchema } from "./schemas";

@injectable()
export class DriverRouter {
  private utilities: Utilities;
  private driverServices: DriverServices;
  private routeUtilities: RouteUtilities;

  private logger: winston.Logger;

  private router!: Router;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(DriverServices) driverServices: DriverServices,
    @inject(RouteUtilities) routeUtilities: RouteUtilities
  ) {
    this.utilities = utilities;
    this.driverServices = driverServices;
    this.routeUtilities = routeUtilities;

    this.logger = utilities.getLogger("driver-router");

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
     * /drivers:
     *  post:
     *    summary: Register a new driver.
     *    tags: [Drivers]
     *    requestBody:
     *      required: true
     *      content:
     *        multipart/form-data:
     *          schema:
     *            $ref: '#/components/schemas/CreateDriverDto'
     *    responses:
     *      200:
     *        description: Returns the created driver.
     *      400:
     *        description: National Id or car driving license Id already exists.
     */
    this.router.post(
      "/",
      upload.single("image"),
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(createDriverSchema),
      async (
        req: Request<any, any, CreateDriverDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let imageFilename = "";
          if (req.file) {
            imageFilename = req.file.filename;
          }
          let birthDate = new Date(req.body.birthDate);
          const payload = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            birthDate: birthDate,
            nationalId: req.body.nationalId,
            carDrivingLicenseId: req.body.carDrivingLicenseId,
            imageFilename: imageFilename,
          };
          const driver = await this.driverServices.createDriver(payload);
          res.status(StatusCodes.OK).send(driver);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /drivers/images/{filename}:
     *  get:
     *    summary: Get the image of the driver.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverImageFilename'
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
     * /drivers:
     *  get:
     *    summary: Get a list of drivers.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/SearchDriversCriteriaFirstName'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaLastName'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaNationalId'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaCarDrivingLicenseId'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaImageFilename'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaStartBirthDate'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaEndBirthDate'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaLimit'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaOffset'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaOrderBy'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaOrderDir'
     *    responses:
     *      200:
     *        description: Returns a list of drivers and total
     *      400:
     *        description: Bad Request.
     */
    this.router.get(
      "/",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<any, any, any, SearchDriversCriteriaQuery>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let firstName = undefined;
          if (!isEmpty(req.query.firstName)) {
            firstName = req.query.firstName;
          }

          let lastName = undefined;
          if (!isEmpty(req.query.lastName)) {
            lastName = req.query.lastName;
          }

          let nationalId = undefined;
          if (!isEmpty(req.query.nationalId)) {
            nationalId = req.query.nationalId;
          }

          let carDrivingLicenseId = undefined;
          if (!isEmpty(req.query.carDrivingLicenseId)) {
            carDrivingLicenseId = req.query.carDrivingLicenseId;
          }

          let imageFilename = undefined;
          if (!isEmpty(req.query.imageFilename)) {
            imageFilename = req.query.imageFilename;
          }

          let startBirthDate = undefined;
          if (!isEmpty(req.query.startBirthDate)) {
            startBirthDate = req.query.startBirthDate;
          }

          let endBirthDate = undefined;
          if (!isEmpty(req.query.endBirthDate)) {
            endBirthDate = req.query.endBirthDate;
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
            firstName,
            lastName,
            nationalId,
            carDrivingLicenseId,
            imageFilename,
            startBirthDate,
            endBirthDate,
            limit,
            offset,
            orderBy,
            orderDir,
          };

          const result = await this.driverServices.getDrivers(payload);

          res.status(StatusCodes.OK).send(result);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /drivers/{id}:
     *  get:
     *    summary: Get the specific driver by ID.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverId'
     *    responses:
     *      200:
     *        description: Returns the specific driver.
     *      404:
     *        description: Driver was not found.
     */
    this.router.get(
      "/:id",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }, any, UpdateDriverDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const driver = await this.driverServices.getDriverById(req.params.id);
          res.status(StatusCodes.OK).send(driver);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /drivers/{id}:
     *  patch:
     *    summary: Update a driver.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverId'
     *    requestBody:
     *      required: true
     *      content:
     *        multipart/form-data:
     *          schema:
     *            $ref: '#/components/schemas/UpdateDriverDto'
     *    responses:
     *      200:
     *        description: Returns the updated driver.
     *      404:
     *        description: Driver was not found.
     *      400:
     *        description: National Id or car driving license Id exists.
     */
    this.router.patch(
      "/:id",
      upload.single("image"),
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(updateDriverSchema),
      async (
        req: Request<{ id: string }, any, UpdateDriverDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let imageFilename = "";
          if (req.file) {
            imageFilename = req.file.filename;
          }
          let birthDate = new Date(req.body.birthDate);
          const payload = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            birthDate: birthDate,
            nationalId: req.body.nationalId,
            carDrivingLicenseId: req.body.carDrivingLicenseId,
            imageFilename: imageFilename,
          };
          const driver = await this.driverServices.updateDriver(
            req.params.id,
            payload
          );
          res.status(StatusCodes.OK).send(driver);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /drivers/{id}:
     *  delete:
     *    summary: Delete a driver.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverId'
     *    responses:
     *      200:
     *        description: Returns the deleted driver.
     *      404:
     *        description: Driver was not found.
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
          const driver = await this.driverServices.deleteDriver(req.params.id);
          res.status(StatusCodes.OK).send(driver);
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
