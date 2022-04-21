import { CameraStatus } from "@prisma/client";
import express, { NextFunction, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import winston from "winston";
import { Utilities } from "../../../commons/utilities/Utilities";
import { CameraService } from "../../../services/cameras/CameraService";
import { Request } from "../../interfaces";
import { RouteUtilities } from "../../RouteUtilities";
import { CreateCameraDto, SearchCamerasCriteriaQuery, UpdateCameraDto } from "./interfaces";
import { createCameraSchema, updateCameraSchema } from "./schemas";

@injectable()
export class CameraRouter {
  private utilities: Utilities;
  private cameraServices: CameraService;
  private routeUtilities: RouteUtilities;

  private logger: winston.Logger;

  private router!: Router;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(CameraService) cameraServices: CameraService,
    @inject(RouteUtilities) routeUtilities: RouteUtilities
  ) {
    this.utilities = utilities;
    this.cameraServices = cameraServices;
    this.routeUtilities = routeUtilities;

    this.logger = utilities.getLogger("camera-router");

    this.instanciateRouter();

    this.logger.info("constructed.");
  }

  private instanciateRouter() {
    this.router = express.Router();

    /*
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
    */

    /**
     * @swagger
     * /cameras:
     *  post:
     *    summary: Register a new camera.
     *    tags: [Cameras]
     *    requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            $ref: '#/components/schemas/CreateCameraDto'
     *    responses:
     *      200:
     *        description: Returns the created camera.
     *      400:
     *        description: Referenced car doesn't exist.
     */
    this.router.post(
      "/",
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(createCameraSchema),
      async (
        req: Request<any, any, CreateCameraDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let payload = req.body;
          const camera = await this.cameraServices.createCamera(payload);
          res.status(StatusCodes.OK).send(camera);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cameras:
     *  get:
     *    summary: Get a list of cameras.
     *    tags: [Cameras]
     *    parameters:
     *      - $ref: '#/components/parameters/SearchCamerasCriteriaName'
     *      - $ref: '#/components/parameters/SearchCamerasCriteriaDescription'
     *      - $ref: '#/components/parameters/SearchCamerasCriteriaStreamUrl'
     *      - $ref: '#/components/parameters/SearchCamerasCriteriaCarId'
     *      - $ref: '#/components/parameters/SearchCamerasCriteriaStatus'
     *      - $ref: '#/components/parameters/SearchCamerasCriteriaLimit'
     *      - $ref: '#/components/parameters/SearchCamerasCriteriaOffset'
     *      - $ref: '#/components/parameters/SearchCamerasCriteriaOrderBy'
     *      - $ref: '#/components/parameters/SearchCamerasCriteriaOrderDir'
     *    responses:
     *      200:
     *        description: Returns a list of cameras and total
     *      400:
     *        description: Bad Request.
     */
    this.router.get(
      "/",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<any, any, any, SearchCamerasCriteriaQuery>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          let payload = {};
          if (!isEmpty(req.query.name)) {
            payload = { ...payload, name: req.query.name };
          }
          if (!isEmpty(req.query.description)) {
            payload = { ...payload, description: req.query.description };
          }
          if (!isEmpty(req.query.streamUrl)) {
            payload = { ...payload, streamUrl: req.query.streamUrl };
          }
          if (!isEmpty(req.query.carId)) {
            payload = { ...payload, carId: req.query.carId };
          }
          if (!isEmpty(req.query.status)) {
            if (req.query.status === CameraStatus.INACTIVE) {
              payload = { ...payload, status: CameraStatus.INACTIVE };
            } else {
              payload = { ...payload, status: CameraStatus.ACTIVE };
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

          const result = await this.cameraServices.getCameras(payload);

          res.status(StatusCodes.OK).send(result);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cameras/{id}:
     *  get:
     *    summary: Get the specific camera by ID.
     *    tags: [Cameras]
     *    parameters:
     *      - $ref: '#/components/parameters/CameraId'
     *    responses:
     *      200:
     *        description: Returns the specific camera.
     *      404:
     *        description: Camera was not found.
     */
    this.router.get(
      "/:id",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }, any, UpdateCameraDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const camera = await this.cameraServices.getCameraById(req.params.id);
          res.status(StatusCodes.OK).send(camera);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cameras/{id}:
     *  patch:
     *    summary: Update a camera.
     *    tags: [Cameras]
     *    parameters:
     *      - $ref: '#/components/parameters/CameraId'
     *    requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            $ref: '#/components/schemas/UpdateCameraDto'
     *    responses:
     *      200:
     *        description: Returns the updated camera.
     *      404:
     *        description: Camera was not found.
     *      400:
     *        description: Referenced car doesn't exist.
     */
    this.router.patch(
      "/:id",
      this.routeUtilities.authenticateJWT(),
      this.routeUtilities.validateSchema(updateCameraSchema),
      async (
        req: Request<{ id: string }, any, UpdateCameraDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const payload = {
            ...req.body
          };
          const camera = await this.cameraServices.updateCamera(
            req.params.id,
            payload
          );
          res.status(StatusCodes.OK).send(camera);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /cameras/{id}:
     *  delete:
     *    summary: Delete a camera.
     *    tags: [Cameras]
     *    parameters:
     *      - $ref: '#/components/parameters/CameraId'
     *    responses:
     *      200:
     *        description: Returns the deleted camera.
     *      404:
     *        description: Camera was not found.
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
          const camera = await this.cameraServices.deleteCamera(req.params.id);
          res.status(StatusCodes.OK).send(camera);
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
