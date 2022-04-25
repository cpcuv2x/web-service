import { DriverStatus, Gender, UserRole } from "@prisma/client";
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
import { AuthService } from "../../../services/auth/AuthService";
import { DriverService } from "../../../services/drivers/DriverService";
import { Request } from "../../interfaces";
import { RouteUtilities } from "../../RouteUtilities";
import {
  CreateDriverDto, GetDriverAccidentLogsCriteriaQuery,
  GetDrowsinessInfluxQuery,
  GetECRInfluxQuery,
  SearchDriversCriteriaQuery,
  UpdateDriverDto,
  UpdateDriverModelDto
} from "./interfaces";
import { createDriverSchema, updateDriverSchema } from "./schemas";

@injectable()
export class DriverRouter {
  private utilities: Utilities;
  private driverServices: DriverService;
  private authService: AuthService;
  private routeUtilities: RouteUtilities;

  private logger: winston.Logger;

  private router!: Router;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(DriverService) driverServices: DriverService,
    @inject(AuthService) authService: AuthService,
    @inject(RouteUtilities) routeUtilities: RouteUtilities
  ) {
    this.utilities = utilities;
    this.driverServices = driverServices;
    this.authService = authService;
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
     *        application/json:
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
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(createDriverSchema),
      async (
        req: Request<any, any, CreateDriverDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const { gender, birthDate, username, password, ...other } = req.body;
          let _gender: Gender = Gender.NOT_SPECIFIED;
          if (req.body.gender === Gender.MALE) {
            _gender = Gender.MALE;
          }
          else if (req.body.gender === Gender.FEMALE) {
            _gender = Gender.FEMALE;
          }
          let _birthDate = new Date(req.body.birthDate);
          const user = await this.authService.register({
            role: UserRole.DRIVER,
            username: req.body.username,
            password: req.body.password,
          });
          let payload = { ...other, id: user.id, gender: _gender, birthDate: _birthDate };
          const driver = await this.driverServices.createDriver(payload);
          res.status(StatusCodes.OK).send(driver);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /drivers/{id}/image:
     *  patch:
     *    summary: Update the image of the driver.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverId'
     *    requestBody:
     *      required: true
     *      content:
     *        multipart/form-data:
     *          schema:
     *            $ref: '#/components/schemas/UpdateDriverImageDto'
     *    responses:
     *      200:
     *        description: Returns the updated driver.
     *      404:
     *        description: Driver was not found.
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
            await this.driverServices.getDriverById(req.params.id)
          ).imageFilename;
          try {
            fs.unlinkSync(path.join(".images", oldImageFilename));
          } catch (error) {}
          const driver = await this.driverServices.updateDriver(req.params.id, {
            imageFilename,
          });
          res.status(StatusCodes.OK).send(driver);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @deprecated
     * @swagger
     * /drivers/images/{filename}:
     *  get:
     *    deprecated: true
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
     * /drivers/{id}/image:
     *  get:
     *    summary: Get the image of the driver.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverId'
     *    responses:
     *      200:
     *        content:
     *          image/*:
     *            schema:
     *              type: string
     *              format: binary
     *      404:
     *         description: Driver was not found.
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
          const driver = await this.driverServices.getDriverById(req.params.id);
          res.sendFile(path.join(".images", driver.imageFilename), {
            root: process.cwd(),
          });
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /drivers/{id}/image:
     *  delete:
     *    summary: Delete the image of the driver.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverId'
     *    responses:
     *      200:
     *        description: Returns the updated driver.
     *      404:
     *        description: Driver was not found.
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
            await this.driverServices.getDriverById(req.params.id)
          ).imageFilename;
          try {
            fs.unlinkSync(path.join(".images", oldImageFilename));
          } catch (error) {}
          const driver = await this.driverServices.updateDriver(req.params.id, {
            imageFilename: "",
          });
          res.status(StatusCodes.OK).send(driver);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /drivers:
     *  get:
     *    summary: Get a list of drivers.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/SearchDriversCriteriaId'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaFirstNameTH'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaLastNameTH'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaFirstNameEN'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaLastNameEN'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaGender'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaNationalId'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaCarDrivingLicenseId'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaImageFilename'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaStartBirthDate'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaEndBirthDate'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaStartRegisterDate'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaEndRegisterDate'
     *      - $ref: '#/components/parameters/SearchDriversCriteriaStatus'
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
          let payload = {};
          if (!isEmpty(req.query.id)) {
            payload = { ...payload, id: req.query.id };
          }
          if (!isEmpty(req.query.firstNameTH)) {
            payload = { ...payload, firstNameTH: req.query.firstNameTH };
          }
          if (!isEmpty(req.query.lastNameTH)) {
            payload = { ...payload, lastNameTH: req.query.lastNameTH };
          }
          if (!isEmpty(req.query.firstNameEN)) {
            payload = { ...payload, firstNameEN: req.query.firstNameEN };
          }
          if (!isEmpty(req.query.lastNameEN)) {
            payload = { ...payload, lastNameEN: req.query.lastNameEN };
          }
          if (!isEmpty(req.query.gender)) {
            if (req.query.gender === Gender.MALE) {
              payload = { ...payload, gender: Gender.MALE };
            }
            else if (req.query.gender === Gender.FEMALE) {
              payload = { ...payload, gender: Gender.FEMALE };
            } else {
              payload = { ...payload, gender: Gender.NOT_SPECIFIED };
            }
          }
          if (!isEmpty(req.query.nationalId)) {
            payload = { ...payload, nationalId: req.query.nationalId };
          }
          if (!isEmpty(req.query.carDrivingLicenseId)) {
            payload = {
              ...payload,
              carDrivingLicenseId: req.query.carDrivingLicenseId,
            };
          }
          if (!isEmpty(req.query.imageFilename)) {
            payload = { ...payload, imageFilename: req.query.imageFilename };
          }
          if (!isEmpty(req.query.startBirthDate)) {
            payload = { ...payload, startBirthDate: new Date(req.query.startBirthDate!) };
          }
          if (!isEmpty(req.query.endBirthDate)) {
            payload = { ...payload, endBirthDate: new Date(req.query.endBirthDate!) };
          }
          if (!isEmpty(req.query.startRegisterDate)) {
            payload = { ...payload, startRegisterDate: new Date(req.query.startRegisterDate!) };
          }
          if (!isEmpty(req.query.endRegisterDate)) {
            payload = { ...payload, endRegisterDate: new Date(req.query.endRegisterDate!) };
          }
          if (!isEmpty(req.query.status)) {
            if (req.query.status === DriverStatus.INACTIVE) {
              payload = { ...payload, status: DriverStatus.INACTIVE };
            } else {
              payload = { ...payload, status: DriverStatus.ACTIVE };
            }
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
     * /drivers/{id}/ecr:
     *  get:
     *    summary: Get the ECR log of a driver.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverId'
     *      - $ref: '#/components/parameters/GetECRInfluxQueryCarId'
     *      - $ref: '#/components/parameters/GetECRInfluxQueryStartTime'
     *      - $ref: '#/components/parameters/GetECRInfluxQueryEndTime'
     *      - $ref: '#/components/parameters/GetECRInfluxQueryAggregate'
     *    responses:
     *      200:
     *        description: Returns ECR log of the driver.
     *      404:
     *        description: Driver was not found.
     */
    this.router.get(
      "/:id/ecr",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }, any, any, GetECRInfluxQuery>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let ecrQuery = {
            carId: (req.query.carId as string) || "",
            startTime:
              (req.query.startTime as string) || "1970-01-01T00:00:00Z",
            endTime: (req.query.endTime as string) || "",
            aggregate:
              (req.query.aggregate as unknown as string) === "true"
                ? true
                : false,
          };
          const ecrResult = await this.driverServices.getECRInflux(
            req.params.id,
            ecrQuery
          );
          res.status(StatusCodes.OK).send(ecrResult);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /drivers/{id}/drowsiness:
     *  get:
     *    summary: Get the drowsiness alarm log of a driver.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverId'
     *      - $ref: '#/components/parameters/GetPassengerInfluxQueryStartTime'
     *      - $ref: '#/components/parameters/GetPassengerInfluxQueryEndTime'
     *      - $ref: '#/components/parameters/GetPassengerInfluxQueryAggregate'
     *    responses:
     *      200:
     *        description: Returns drowsiness alarm log of the driver.
     *      404:
     *        description: Driver was not found.
     */
    this.router.get(
      "/:id/drowsiness",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }, any, any, GetDrowsinessInfluxQuery>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let drowsinessQuery = {
            startTime:
              (req.query.startTime as string) || "1970-01-01T00:00:00Z",
            endTime: (req.query.endTime as string) || "",
            aggregate: req.query.aggregate || false,
          };
          const drowsinessResult =
            await this.driverServices.getDrowsinessInflux(
              req.params.id,
              drowsinessQuery
            );
          res.status(StatusCodes.OK).send(drowsinessResult);
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
     *        application/json:
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
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(updateDriverSchema),
      async (
        req: Request<{ id: string }, any, UpdateDriverDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const { gender, birthDate, status, ...other } = req.body;
          let payload: UpdateDriverModelDto = { ...other };
          if (req.body.gender) {
            if (req.body.gender === Gender.MALE) {
              payload.gender = Gender.MALE;
            }
            else if (req.body.gender === Gender.FEMALE) {
              payload.gender = Gender.FEMALE;
            }
            else {
              payload.gender = Gender.NOT_SPECIFIED;
            }
          }
          if (req.body.birthDate) {
            payload.birthDate = new Date(req.body.birthDate);
          }
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

    /**
     * @swagger
     * /drivers/{id}/accidents:
     *  get:
     *    summary: Get the accident logs of the driver by specific date range.
     *    tags: [Drivers]
     *    parameters:
     *      - $ref: '#/components/parameters/DriverId'
     *      - $ref: '#/components/parameters/GetDriverAccidentLogsCriteriaStartTime'
     *      - $ref: '#/components/parameters/GetDriverAccidentLogsCriteriaEndTime'
     *    responses:
     *      200:
     *        description: Returns the accident logs of the driver by specific date range.
     */
    this.router.get(
      "/:id/accidents",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<
          { id: string },
          any,
          any,
          GetDriverAccidentLogsCriteriaQuery
        >,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const payload: any = { driverId: req.params.id };

          if (!isEmpty(req.query.startTime)) {
            payload.startTime = new Date(req.query.startTime!);
          }
          if (!isEmpty(req.query.endTime)) {
            payload.endTime = new Date(req.query.endTime!);
          }

          const logs = await this.driverServices.getDriverAccidentLogs(payload);

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
