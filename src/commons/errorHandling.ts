import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";

export const errorHandling =
  () => (err: any, req: Request, res: Response, next: NextFunction) => {
    if (!(err instanceof createHttpError.HttpError)) {
      err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }
    res.status(err.statusCode).send(err.message);
  };
