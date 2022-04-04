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
     *        multipart/form-data:
     *          schema:
     *            $ref: '#/components/schemas/CreateCameraDto'
     *    responses:
     *      200:
     *        description: Returns the created camera.
     *      400:
     *        description: Something (temp).
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
          const payload = {
            ...req.body
          };
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
          let name = undefined;
          if (!isEmpty(req.query.name)) {
            name = req.query.name;
          }

          let description = undefined;
          if (!isEmpty(req.query.description)) {
            description = req.query.description;
          }

          let streamUrl = undefined;
          if (!isEmpty(req.query.streamUrl)) {
            streamUrl = req.query.streamUrl;
          }

          let carId = undefined;
          if (!isEmpty(req.query.carId)) {
            carId = req.query.carId;
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
            name,
            description,
            streamUrl,
            carId,
            limit,
            offset,
            orderBy,
            orderDir,
          };

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
     *        multipart/form-data:
     *          schema:
     *            $ref: '#/components/schemas/UpdateCameraDto'
     *    responses:
     *      200:
     *        description: Returns the updated camera.
     *      404:
     *        description: Camera was not found.
     *      400:
     *        description: Something (temp).
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
