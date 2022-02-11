import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import createHttpError from "http-errors";
import {
  CreateDashboardDto,
  UpdateDashboardComponentsDto,
  UpdateDashboardDto,
} from "./interfaces";

const prisma = new PrismaClient();

export const createDashboard = (payload: CreateDashboardDto) => {
  return prisma.$transaction(async (prisma) => {
    if (payload.default) {
      await uncheckDefaultDashboard();
    }
    const dashboard = await prisma.dashboard.create({
      data: payload,
    });
    return dashboard;
  });
};

export const getAllDashboards = () => {
  return prisma.dashboard.findMany({
    orderBy: {
      name: Prisma.SortOrder.asc,
    },
  });
};

export const getDashboardById = async (id: string) => {
  const dashboard = await prisma.dashboard.findUnique({
    where: {
      id,
    },
    include: {
      components: true,
    },
  });
  if (!dashboard) {
    throw new createHttpError.NotFound("Dashboard was not found.");
  }
  return dashboard;
};

export const updateDashboard = (id: string, payload: UpdateDashboardDto) => {
  return prisma.$transaction(async (prisma) => {
    if (payload.default) {
      await uncheckDefaultDashboard();
    }
    try {
      return await prisma.dashboard.update({
        where: { id },
        data: payload,
      });
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2025") {
        throw new createHttpError.NotFound("Dashboard was not found.");
      } else {
        throw new createHttpError.InternalServerError(
          "Update dashboard failed."
        );
      }
    }
  });
};

export const deleteDashboard = async (id: string) => {
  try {
    return await prisma.dashboard.delete({ where: { id } });
  } catch (error) {
    const prismaError = error as PrismaClientKnownRequestError;
    if (prismaError.code === "P2025") {
      throw new createHttpError.NotFound("Dashboard was not found.");
    } else {
      throw new createHttpError.InternalServerError("Delete dashboard failed.");
    }
  }
};

const uncheckDefaultDashboard = () =>
  prisma.dashboard.updateMany({
    where: { default: true },
    data: { default: false },
  });

export const updateDashboardComponents = (
  id: string,
  payload: UpdateDashboardComponentsDto
) => {
  return prisma.$transaction(async (prisma) => {
    let created, updated, deleted;
    try {
      created = await prisma.dashboardComponentAssociation.createMany({
        data: payload.create.map((creation) => ({
          ...creation,
          dashboardId: id,
        })),
      });
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2003") {
        throw new createHttpError.BadRequest(
          "Update dashboard components failed on creation, some of the entities were not found."
        );
      } else {
        throw new createHttpError.InternalServerError(
          "Update dashboard components failed on creation."
        );
      }
    }
    try {
      updated = await Promise.all(
        payload.update.map((update) => {
          const { dashboardComponentAssociationId, ...rest } = update;
          return prisma.dashboardComponentAssociation.update({
            where: { id: dashboardComponentAssociationId },
            data: rest,
          });
        })
      );
    } catch (error) {
      const prismaError = error as PrismaClientKnownRequestError;
      if (prismaError.code === "P2025") {
        throw new createHttpError.BadRequest(
          "Update dashboard components failed on update, some of the entities were not found."
        );
      } else {
        throw new createHttpError.InternalServerError(
          "Update dashboard components failed on update."
        );
      }
    }
    deleted = await prisma.dashboardComponentAssociation.deleteMany({
      where: { id: { in: payload.delete } },
    });
    return { created, updated: { count: updated.length }, deleted };
  });
};

export const mockDashboardComponents = () => {
  return prisma.dashboardComponent.createMany({
    data: [{ type: "CAMERA_STREAM" }, { type: "CAR_INFORMATION" }],
  });
};
