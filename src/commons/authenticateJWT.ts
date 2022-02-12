import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { getConfig } from "./config";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, "password">;
    }
  }
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = jwt.verify(
      req.cookies.jwt,
      getConfig().jwt.secret!
    ) as Omit<User, "password">;
    req.user = payload;
    next();
  } catch (error) {
    next(new createHttpError.Unauthorized("Unauthorized."));
  }
};
