import express, { NextFunction, Request, Response } from "express";
import { authentciateToken } from "../commons/authenticateToken";
import { LoginDto, RegisterDto } from "./interface";

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
 *      200:
 *        description: Returns the created user.
 *      400:
 *        description: Username has already been used.
 */
router.post(
  "/register",
  async (
    req: Request<any, any, RegisterDto>,
    res: Response,
    next: NextFunction
  ) => {}
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
 *        description:
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
  authentciateToken,
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const authRouter = router;
