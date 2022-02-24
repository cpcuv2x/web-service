import { Prisma, PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";
import {
  CreateDashboardDto,
  UpdateDashboardComponentsDto,
  UpdateDashboardDto,
} from "./interfaces";

const prisma = new PrismaClient();

export const createDashboard = (
  userId: string,
  payload: CreateDashboardDto
) => {
  return prisma.$transaction(async (prisma) => {
    if (payload.default) {
      await uncheckDefaultDashboard(userId);
    }
    const dashboard = await prisma.dashboard.create({
      data: { userId, ...payload },
    });
    return dashboard;
  });
};

export const getAllDashboards = (userId: string) => {
  return prisma.dashboard.findMany({
    where: {
      userId,
    },
    orderBy: {
      name: Prisma.SortOrder.asc,
    },
  });
};

export const getDashboardById = async (userId: string, dashboardId: string) => {
  const dashboard = await prisma.dashboard.findUnique({
    where: {
      id: dashboardId,
    },
    include: {
      components: true,
    },
  });
  if (!dashboard) {
    throw new createHttpError.NotFound(
      `Dashboard "${dashboardId}" was not found.`
    );
  }
  if (dashboard.userId !== userId) {
    throw new createHttpError.Forbidden(
      `Dashboard "${dashboardId}" cannot be accessed.`
    );
  }
  return dashboard;
};

export const updateDashboard = (
  userId: string,
  dashboardId: string,
  payload: UpdateDashboardDto
) => {
  return prisma.$transaction(async (prisma) => {
    const dashboard = await prisma.dashboard.findUnique({
      where: {
        id: dashboardId,
      },
    });
    if (!dashboard) {
      throw new createHttpError.NotFound(
        `Dashboard "${dashboardId}" was not found.`
      );
    }
    if (dashboard.userId !== userId) {
      throw new createHttpError.Forbidden(
        `Dashboard "${dashboardId}" cannot be accessed.`
      );
    }
    if (payload.default) {
      await uncheckDefaultDashboard(userId);
    }
    return prisma.dashboard.update({
      where: { id: dashboardId },
      data: payload,
    });
  });
};

export const deleteDashboard = async (userId: string, dashboardId: string) => {
  const dashboard = await prisma.dashboard.findUnique({
    where: {
      id: dashboardId,
    },
  });
  if (!dashboard) {
    throw new createHttpError.NotFound(
      `Dashboard "${dashboardId}" was not found.`
    );
  }
  if (dashboard.userId !== userId) {
    throw new createHttpError.Forbidden(
      `Dashboard "${dashboardId}" cannot be accessed.`
    );
  }
  return prisma.dashboard.deleteMany({ where: { id: dashboardId, userId } });
};

const uncheckDefaultDashboard = (userId: string) =>
  prisma.dashboard.updateMany({
    where: { userId, default: true },
    data: { default: false },
  });

export const updateDashboardComponents = (
  userId: string,
  dashboardId: string,
  payload: UpdateDashboardComponentsDto
) => {
  return prisma.$transaction(async (prisma) => {
    const dashboard = await prisma.dashboard.findUnique({
      where: {
        id: dashboardId,
      },
    });
    if (!dashboard) {
      throw new createHttpError.NotFound(
        `Dashboard "${dashboardId}" was not found.`
      );
    }
    if (dashboard.userId !== userId) {
      throw new createHttpError.Forbidden(
        `Dashboard "${dashboardId}" cannot be accessed.`
      );
    }

    let created, updated, deleted;

    created = await Promise.all(
      payload.create.map(async (creation) => {
        const { dashboardComponentId, ...rest } = creation;
        const dashboardComponent = await prisma.dashboardComponent.findUnique({
          where: { id: dashboardComponentId },
        });
        if (!dashboardComponent) {
          throw new createHttpError.NotFound(
            `Dashboard component "${dashboardComponentId}" was not found.`
          );
        }
        return prisma.dashboardComponentAssociation.create({
          data: { ...creation, dashboardId },
        });
      })
    );

    updated = await Promise.all(
      payload.update.map(async (update) => {
        const { dashboardComponentAssociationId, ...rest } = update;
        const dashboardComponentAssociation =
          await prisma.dashboardComponentAssociation.findUnique({
            where: { id: dashboardComponentAssociationId },
          });
        if (!dashboardComponentAssociation) {
          throw new createHttpError.NotFound(
            `Dashboard component association "${dashboardComponentAssociationId}" was not found.`
          );
        }
        if (dashboardComponentAssociation.dashboardId !== dashboardId) {
          throw new createHttpError.Forbidden(
            `Dashboard component association "${dashboardComponentAssociationId}" cannot be accessed.`
          );
        }
        return prisma.dashboardComponentAssociation.update({
          where: { id: dashboardComponentAssociationId },
          data: rest,
        });
      })
    );

    deleted = await Promise.all(
      payload.delete.map(async (dashboardComponentAssociationId) => {
        const dashboardComponentAssociation =
          await prisma.dashboardComponentAssociation.findUnique({
            where: { id: dashboardComponentAssociationId },
          });
        if (!dashboardComponentAssociation) {
          throw new createHttpError.NotFound(
            `Dashboard component association ${dashboardComponentAssociationId} was not found.`
          );
        }
        if (dashboardComponentAssociation.dashboardId !== dashboardId) {
          throw new createHttpError.Forbidden(
            `Dashboard component association ${dashboardComponentAssociationId} cannot be accessed.`
          );
        }
        return prisma.dashboardComponentAssociation.delete({
          where: { id: dashboardComponentAssociationId },
        });
      })
    );

    return {
      created: { count: created.length },
      updated: { count: updated.length },
      deleted: { count: deleted.length },
    };
  });
};

export const mockDashboardComponents = () => {
  return prisma.dashboardComponent.createMany({
    data: [{ type: "CAMERA_STREAM" }, { type: "CAR_INFORMATION" }],
  });
};
