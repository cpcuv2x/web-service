import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import Joi from "joi";

export const validate =
  (schema: Joi.ObjectSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const validation = await schema.validate(req.body);
    if (validation.error) {
      return next(new createHttpError.BadRequest(validation.error.message));
    }
    next();
  };
