import { User } from "@prisma/client";
import { NextFunction, Response } from "express";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import jwt from "jsonwebtoken";
import swaggerJSDoc from "swagger-jsdoc";
import { Configurations } from "./Configurations";
import { Request } from "./interfaces";

interface RouteUtilitiesDependencies {
  configurations: Configurations;
}

export class RouteUtilities {
  private dependencies: RouteUtilitiesDependencies;

  constructor(dependencies: RouteUtilitiesDependencies) {
    this.dependencies = dependencies;
  }

  public authenticateJWT() {
    const { configurations } = this.dependencies;
    return (req: Request, res: Response, next: NextFunction) => {
      const { secret } = configurations.getConfig().jwt;
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
    const { configurations } = this.dependencies;
    const { openapi, title, version, description, apis } =
      configurations.getConfig().swagger;
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
