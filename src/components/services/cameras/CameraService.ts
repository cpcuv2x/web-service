import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import createHttpError from "http-errors";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import winston from "winston";
import { Utilities } from "../../commons/utilities/Utilities";
import {
  CreateCameraDto,
  SearchCamerasCriteria,
  UpdateCameraDto
} from "../../express-app/routes/cameras/interfaces";

@injectable()
export class CameraService {
  private utilities: Utilities;
  private prismaClient: PrismaClient;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject("prisma-client") prismaClient: PrismaClient
  ) {
    this.utilities = utilities;
    this.prismaClient = prismaClient;

    this.logger = utilities.getLogger("camera-service");

    this.logger.info("constructed.");
  }

  public async createCamera(payload: CreateCameraDto) {
    try {
      const camera = await this.prismaClient.camera.create({
        data: {
          ...payload
        },
      });
      return camera;
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2003") {
        const clue = (prismaError.meta as any).field_name;
        if (clue === "Camera_carId_fkey (index)") {
          throw new createHttpError.BadRequest("Referenced car doesn't exist.");
        }
      }
      else {
        throw new createHttpError.InternalServerError(prismaError.message);
      }
    }
  }

  public async getCameras(payload: SearchCamerasCriteria) {
    const {
      name,
      description,
      streamUrl,
      carId,
      limit,
      offset,
      orderBy,
      orderDir,
    } = payload;

    let nameWhereClause = {};
    if (!isEmpty(name)) {
      nameWhereClause = {
        name: {
          contains: name,
          mode: "insensitive",
        },
      };
    }

    let descriptionWhereClause = {};
    if (!isEmpty(description)) {
      descriptionWhereClause = {
        description: {
          contains: description,
          mode: "insensitive",
        },
      };
    }

    let streamUrlWhereClause = {};
    if (!isEmpty(streamUrl)) {
      streamUrlWhereClause = {
        streamUrl: {
          contains: streamUrl,
          mode: "insensitive",
        },
      };
    }

    let carIdWhereClause = {};
    if (!isEmpty(carId)) {
      carIdWhereClause = {
        carId: {
          contains: carId,
          mode: "insensitive",
        },
      };
    }

    const whereClauses = {
      ...nameWhereClause,
      ...descriptionWhereClause,
      ...streamUrlWhereClause,
      ...carIdWhereClause,
    };

    let skipClause = {};
    if (isFinite(offset!)) {
      skipClause = { skip: offset };
    }

    let takeClause = {};
    if (isFinite(limit!)) {
      takeClause = { take: limit };
    }

    let orderByClause = {};
    if (!isEmpty(orderBy) && !isEmpty(orderDir)) {
      orderByClause = { orderBy: { [orderBy!]: orderDir } };
    }

    try {
      const cameras = await this.prismaClient.camera.findMany({
        where: whereClauses,
        ...skipClause,
        ...takeClause,
        ...orderByClause,
      });
      const count = await this.prismaClient.camera.count({
        where: whereClauses,
      });
      return { cameras, count };
    } catch (error) {
      throw new createHttpError.BadRequest("Bad request.");
    }
  }

  public async getCameraById(id: string) {
    const camera = await this.prismaClient.camera.findUnique({
      where: {
        id,
      },
    });

    if (!camera) {
      throw new createHttpError.NotFound(`Camera was not found.`);
    }

    return camera;
  }

  public async updateCamera(id: string, payload: UpdateCameraDto) {
    const camera = await this.prismaClient.camera.findUnique({
      where: {
        id,
      },
    });

    if (!camera) {
      throw new createHttpError.NotFound(`Camera was not found.`);
    }

    try {
      const camera = await this.prismaClient.camera.update({
        where: {
          id,
        },
        data: {
          ...payload,
        },
      });
      return camera;
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      throw new createHttpError.InternalServerError(prismaError.message);
    }
  }

  public async deleteCamera(id: string) {
    const camera = await this.prismaClient.camera.findUnique({
      where: {
        id,
      },
    });

    if (!camera) {
      throw new createHttpError.NotFound(`Camera was not found.`);
    }

    return this.prismaClient.camera.delete({ where: { id } });
  }
}
