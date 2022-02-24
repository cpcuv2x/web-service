import { randomBytes } from "crypto";
import express, { NextFunction, Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
import path from "path";
import { RouteUtilities } from "../../commons/RouteUtilities";
import { CarServices } from "./CarServices";
import { CreateCarDto, UpdateCarDto } from "./interface";
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
     *      - name: filename
     *        type: string
     *        in: path
     *        required: true
     *        description: The image's filename.
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
