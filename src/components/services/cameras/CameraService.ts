import { CameraStatus, PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";
import { inject, injectable } from "inversify";
import isEmpty from "lodash/isEmpty";
import winston from "winston";
import { Utilities } from "../../commons/utilities/Utilities";
import {
  CreateCameraDto,
  SearchCamerasCriteria,
  UpdateCameraDto,
} from "../../express-app/routes/cameras/interfaces";
import { CronJob } from "cron";

@injectable()
export class CameraService {
  private utilities: Utilities;
  private prismaClient: PrismaClient;

  private logger: winston.Logger;
  private cameraCronJob: CronJob;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject("prisma-client") prismaClient: PrismaClient
  ) {
    this.utilities = utilities;
    this.prismaClient = prismaClient;

    this.logger = utilities.getLogger("camera-service");

    this.logger.info("constructed.");
    this.cameraCronJob = new CronJob('0 * * * * *', async () => {

      const date = new Date();
      date.setSeconds(date.getSeconds()-80);

      const inactiveCamera = await this.prismaClient.camera.updateMany({
        where: {
          timestamp: {
            lte: date
          },
          status: CameraStatus.ACTIVE
        },
        data: {
          status : CameraStatus.INACTIVE
        }
      })
    })

    if (!this.cameraCronJob.running) {
      this.cameraCronJob.start();
    }
  }

  public async createCamera(payload: CreateCameraDto) {
    try {
      const camera = await this.prismaClient.camera.create({
        data: {
          ...payload,
          status: CameraStatus.INACTIVE,
        },
        include: {
          Car: true,
        },
      });
      return camera;
    } catch (error) {
      throw new createHttpError.InternalServerError("Cannot create camera.");
    }
  }

  public async getCameras(payload: SearchCamerasCriteria) {
    const {
      id,
      name,
      description,
      streamUrl,
      carId,
      status,
      role,
      limit,
      offset,
      orderBy,
      orderDir,
    } = payload;

    let idWhereClause = {};
    if (!isEmpty(id)) {
      idWhereClause = {
        id: {
          contains: id,
          mode: "insensitive",
        },
      };
    }

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
      carIdWhereClause = { carId };
    }

    let statusWhereClause = {};
    if (!isEmpty(status)) {
      statusWhereClause = { status };
    }

    let roleWhereClause = {};
    if (!isEmpty(role)) {
      roleWhereClause = { role };
    }

    const whereClauses = {
      ...idWhereClause,
      ...nameWhereClause,
      ...descriptionWhereClause,
      ...streamUrlWhereClause,
      ...carIdWhereClause,
      ...statusWhereClause,
      ...roleWhereClause,
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
        include: {
          Car: true,
        },
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
      include: {
        Car: true,
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
      include: {
        Car: true,
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
      throw new createHttpError.InternalServerError("Cannot update camera.");
    }
  }

  public async deleteCamera(id: string) {
    const camera = await this.prismaClient.camera.findUnique({
      where: {
        id,
      },
      include: {
        Car: true,
      },
    });

    if (!camera) {
      throw new createHttpError.NotFound(`Camera was not found.`);
    }

    return this.prismaClient.camera.delete({ where: { id } });
  }
}
