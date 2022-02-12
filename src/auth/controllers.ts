import express, { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { authenticateToken } from "../commons/authenticateToken";
import { validate } from "../commons/validate";
import { LoginDto, RegisterDto } from "./interface";
import { RegisterSchema } from "./schemas";
import * as services from "./services";

const router = express.Router();

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
router.post(
  "/register",
  validate(RegisterSchema),
  async (
    req: Request<any, any, RegisterDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await services.register(req.body);
      const jwt = services.getJWT(user);
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
router.post(
  "/login",
  async (
    req: Request<any, any, LoginDto>,
    res: Response,
    next: NextFunction
  ) => {}
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
router.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {}
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
router.get(
  "/currentuser",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const authRouter = router;
