import express, { NextFunction, Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { RouteUtilities } from "../commons/RouteUtilities";
import { AuthServices } from "./AuthServices";
import { LoginDto, RegisterDto } from "./interface";
import { LoginSchema, RegisterSchema } from "./schemas";

interface AuthRouterDependencies {
  authServices: AuthServices;
  routeUtilities: RouteUtilities;
}

export class AuthRouter {
  private dependencies: AuthRouterDependencies;

  private router!: Router;

  constructor(dependencies: AuthRouterDependencies) {
    this.dependencies = dependencies;
    this.instanciateRouter();
  }

  private instanciateRouter() {
    const { routeUtilities, authServices } = this.dependencies;

    this.router = express.Router();

    /**
     * @swagger
     * /auth/register:
     *  post:
     *    summary: Register a new user.
     *    tags: [Authentication]
     *    requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            $ref: '#/components/schemas/RegisterDto'
     *    responses:
     *      201:
     *        description: Returns the created user.
     *      400:
     *        description: Username has already been used.
     */
    this.router.post(
      "/register",
      routeUtilities.validateSchema(RegisterSchema),
      async (
        req: Request<any, any, RegisterDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const user = await authServices.register(req.body);
          const jwt = authServices.getJWT(user);
          res.cookie("jwt", jwt);
          res.status(StatusCodes.CREATED).send(user);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /auth/login:
     *  post:
     *    summary: Log in to the system.
     *    tags: [Authentication]
     *    requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            $ref: '#/components/schemas/LoginDto'
     *    responses:
     *      200:
     *        description: Returns the logged-in user.
     *      400:
     *        description: Invalid credentials.
     */
    this.router.post(
      "/login",
      routeUtilities.validateSchema(LoginSchema),
      async (
        req: Request<any, any, LoginDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const user = await authServices.login(req.body);
          const jwt = authServices.getJWT(user);
          res.cookie("jwt", jwt);
          res.status(StatusCodes.OK).send(user);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /auth/logout:
     *  post:
     *    summary: Log out from the system.
     *    tags: [Authentication]
     *    responses:
     *      200:
     *        description: successfully logged out.
     */
    this.router.post(
      "/logout",
      async (req: Request, res: Response, next: NextFunction) => {
        res.clearCookie("jwt");
        res.status(StatusCodes.OK).send({});
      }
    );

    /**
     * @swagger
     * /auth/currentuser:
     *  get:
     *    summary: Get the current user.
     *    tags: [Authentication]
     *    responses:
     *      200:
     *        description: Returns the current user.
     *      401:
     *        description: Unauthorized.
     */
    this.router.get(
      "/currentuser",
      routeUtilities.authenticateJWT(),
      async (req: Request, res: Response, next: NextFunction) => {
        res.status(StatusCodes.OK).send(req.user);
      }
    );
  }

  public getRouterInstance() {
    return this.router;
  }
}
