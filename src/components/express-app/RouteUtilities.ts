import { User } from "@prisma/client";
import { NextFunction, Response } from "express";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";
import Joi from "joi";
import jwt from "jsonwebtoken";
import swaggerJSDoc from "swagger-jsdoc";
import winston from "winston";
import { Configurations } from "../commons/configurations/Configurations";
import { Utilities } from "../commons/utilities/Utilities";
import { Request } from "./interfaces";

@injectable()
export class RouteUtilities {
  private utilities: Utilities;
  private configurations: Configurations;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(Configurations) configurations: Configurations
  ) {
    this.utilities = utilities;
    this.configurations = configurations;

    this.logger = utilities.getLogger("route-utilities");

    this.logger.info("constructed.");
  }

  public authenticateJWT() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { secret } = this.configurations.getConfig().jwt;
      try {
        const payload = jwt.verify(req.cookies.jwt, secret!) as Omit<
          User,
          "password"
        >;
        req.user = payload;
        next();
      } catch (error) {
        next(new createHttpError.Unauthorized("Unauthorized."));
      }
    };
  }

  public validateSchema(schema: Joi.ObjectSchema) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const validation = await schema.validate(req.body);
      if (validation.error) {
        return next(new createHttpError.BadRequest(validation.error.message));
      }
      next();
    };
  }

  public errorHandling() {
    return (err: any, req: Request, res: Response, next: NextFunction) => {
      if (!(err instanceof createHttpError.HttpError)) {
        err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      }
      res.status(err.statusCode).send(err.message);
    };
  }

  public getSwaggerSpec() {
    const { openapi, title, version, description, apis } =
      this.configurations.getConfig().swagger;
    const options = {
      definition: {
        openapi,
        info: {
          title,
          version,
          description,
        },
      },
      apis,
    };
    return swaggerJSDoc(options);
  }
}
