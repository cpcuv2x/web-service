import express, { NextFunction, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";
import winston from "winston";
import { Utilities } from "../../../commons/utilities/Utilities";
import { AuthService } from "../../../services/auth/AuthService";
import { Request } from "../../interfaces";
import { RouteUtilities } from "../../RouteUtilities";
import { LoginDto, RegisterDto } from "./interfaces";
import { LoginSchema, RegisterSchema } from "./schemas";

@injectable()
export class AuthRouter {
  private utilities: Utilities;
  private authServices: AuthService;
  private routeUtilities: RouteUtilities;

  private logger: winston.Logger;

  private router!: Router;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(AuthService) authServices: AuthService,
    @inject(RouteUtilities) routeUtilities: RouteUtilities
  ) {
    this.utilities = utilities;
    this.authServices = authServices;
    this.routeUtilities = routeUtilities;

    this.logger = utilities.getLogger("auth-router");

    this.instanciateRouter();

    this.logger.info("constructed.");
  }

  private instanciateRouter() {
    this.router = express.Router();

    /**
     * @deprecated
     * @swagger
     * /auth/register:
     *  post:
     *    deprecated: true
     *    summary: Register a new user.
     *    tags: [Authentication]
     *    requestBody:
     *      required: true
     *      content:
     *        application/json:
     *          schema:
     *            $ref: '#/components/schemas/RegisterDto'
     *            example:
     *               username: admin
     *               password: 1234
     *               role: ADMIN
     *    responses:
     *      201:
     *        description: Returns the created user.
     *      400:
     *        description: Username has already been used.
     */
    this.router.post(
      "/register",
      this.routeUtilities.validateSchema(RegisterSchema),
      async (
        req: Request<any, any, RegisterDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const user = await this.authServices.register(req.body);
          const jwt = this.authServices.getJWT(user);
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
     *            example:
     *              username: admin
     *              password: 1234
     *              role: ADMIN
     *    responses:
     *      200:
     *        description: Returns the logged-in user.
     *      400:
     *        description: Invalid credentials.
     */
    this.router.post(
      "/login",
      this.routeUtilities.validateSchema(LoginSchema),
      async (
        req: Request<any, any, LoginDto>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const user = await this.authServices.login(req.body);
          const jwt = this.authServices.getJWT(user);
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
     *        description: Successfully logged out.
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
      this.routeUtilities.authenticateJWT(),
      async (req: Request, res: Response, next: NextFunction) => {
        res.status(StatusCodes.OK).send(req.user);
      }
    );
  }

  public getRouterInstance() {
    return this.router;
  }
}
