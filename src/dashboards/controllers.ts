import express, { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { authenticateJWT } from "../commons/authenticateJWT";
import { validate } from "../commons/validate";
import {
  CreateDashboardDto,
  UpdateDashboardComponentsDto,
  UpdateDashboardDto,
} from "./interfaces";
import {
  createDashboardSchema,
  updateDashboardComponentsSchema,
  updateDashboardSchema,
} from "./schemas";
import * as services from "./services";

const router = express.Router();

/**
 * @swagger
 * /dashboards:
 *  get:
 *    summary: Get all dashboards.
 *    tags: [Dashboards (Deprecated)]
 *    responses:
 *      200:
 *        description: Returns a list of dashboards.
 *      401:
 *        description: Unauthorized.
 */
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  const dashboards = await services.getAllDashboards(req.user?.id!);
  res.status(StatusCodes.OK).send(dashboards);
});

/**
 * @swagger
 * /dashboards/{id}:
 *  get:
 *    summary: Get the specific dashboard by ID.
 *    tags: [Dashboards (Deprecated)]
 *    parameters:
 *      - $ref: '#/components/params/DashboardId'
 *    responses:
 *      200:
 *        description: Returns the specific dashboard.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Dashboard "{ID}" cannot be accessed.
 *      404:
 *        description: Dashboard "{ID}" was not found.
 */
router.get(
  "/:id",
  authenticateJWT,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const dashboard = await services.getDashboardById(
        req.user?.id!,
        req.params.id
      );
      res.status(StatusCodes.OK).send(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /dashboards:
 *  post:
 *    summary: Create a dashboard.
 *    tags: [Dashboards (Deprecated)]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/CreateDashboardDto'
 *    responses:
 *      201:
 *        description: Returns the created dashboard.
 *      401:
 *        description: Unauthorized.
 */
router.post(
  "/",
  authenticateJWT,
  validate(createDashboardSchema),
  async (req: Request<any, any, CreateDashboardDto>, res: Response) => {
    const dashboard = await services.createDashboard(req.user?.id!, req.body);
    res.status(StatusCodes.CREATED).send(dashboard);
  }
);

/**
 * @swagger
 * /dashboards/{id}:
 *  patch:
 *    summary: Update the specified dashboard.
 *    tags: [Dashboards (Deprecated)]
 *    parameters:
 *      - $ref: '#/components/params/DashboardId'
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/UpdateDashboardDto'
 *    responses:
 *      200:
 *        description: Returns the updated dashboard.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Dashboard "{ID}" cannot be accessed.
 *      404:
 *        description: Dashboard "{ID}" was not found.
 */
router.patch(
  "/:id",
  authenticateJWT,
  validate(updateDashboardSchema),
  async (
    req: Request<{ id: string }, any, UpdateDashboardDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dashboard = await services.updateDashboard(
        req.user?.id!,
        req.params.id,
        req.body
      );
      res.status(StatusCodes.OK).send(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /dashboards/{id}:
 *  delete:
 *    summary: Delete the specified dashboard.
 *    tags: [Dashboards (Deprecated)]
 *    parameters:
 *      - $ref: '#/components/params/DashboardId'
 *    responses:
 *      200:
 *        description: Returns the deleted dashboard.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Dashboard "{ID}" cannot be accessed.
 *      404:
 *        description: Dashboard "{ID}" was not found.
 */
router.delete(
  "/:id",
  authenticateJWT,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const dashboard = await services.deleteDashboard(
        req.user?.id!,
        req.params.id
      );
      res.status(StatusCodes.OK).send(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /dashboards/{id}/components:
 *  patch:
 *    summary: Update the specific dashboard's components.
 *    tags: [Dashboards (Deprecated)]
 *    parameters:
 *      - $ref: '#/components/params/DashboardId'
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/UpdateDashboardComponentsDto'
 *    responses:
 *      200:
 *        description: Returns count of creation, update, and deletion.
 *      401:
 *        description: Unauthorized.
 *      403:
 *        description: Entity "{ID}" cannot be accessed.
 *      404:
 *        description: Entity "{ID}" was not found.
 */
router.patch(
  "/:id/components",
  authenticateJWT,
  validate(updateDashboardComponentsSchema),
  async (
    req: Request<{ id: string }, any, UpdateDashboardComponentsDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await services.updateDashboardComponents(
        req.user?.id!,
        req.params.id,
        req.body
      );
      res.status(StatusCodes.OK).send(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/mock-components",
  async (req: Request, res: Response, next: NextFunction) => {
    await services.mockDashboardComponents();
    res.status(StatusCodes.OK).send();
  }
);

export const dashboardsRouter = router;
