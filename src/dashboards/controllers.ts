import express, { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
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
 *    tags: [Dashboards]
 *    responses:
 *      200:
 *        description: Returns a list of dashboards.
 */
router.get("/", async (req: Request, res: Response) => {
  const dashboards = await services.getAllDashboards();
  res.status(StatusCodes.OK).send(dashboards);
});

/**
 * @swagger
 * /dashboards/{id}:
 *  get:
 *    summary: Get the specific dashboard by ID.
 *    tags: [Dashboards]
 *    parameters:
 *      - $ref: '#/components/params/DashboardId'
 *    responses:
 *      200:
 *        description: Returns the specific dashboard.
 *      404:
 *        description: Dashboard was not found.
 */
router.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const dashboard = await services.getDashboardById(req.params.id);
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
 *    tags: [Dashboards]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/CreateDashboardDto'
 *    responses:
 *      200:
 *        description: Returns the created dashboard.
 */
router.post(
  "/",
  validate(createDashboardSchema),
  async (req: Request<any, any, CreateDashboardDto>, res: Response) => {
    const dashboard = await services.createDashboard(req.body);
    res.status(StatusCodes.CREATED).send(dashboard);
  }
);

/**
 * @swagger
 * /dashboards/{id}:
 *  patch:
 *    summary: Update the specified dashboard.
 *    tags: [Dashboards]
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
 *      404:
 *        description: Dashboard was not found.
 *      500:
 *        description: Update dashboard failed.
 */
router.patch(
  "/:id",
  validate(updateDashboardSchema),
  async (
    req: Request<{ id: string }, any, UpdateDashboardDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dashboard = await services.updateDashboard(req.params.id, req.body);
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
 *    tags: [Dashboards]
 *    parameters:
 *      - $ref: '#/components/params/DashboardId'
 *    responses:
 *      200:
 *        description: Returns the deleted dashboard.
 *      404:
 *        description: Dashboard was not found.
 *      500:
 *        description: Delete dashboard failed.
 */
router.delete(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const dashboard = await services.deleteDashboard(req.params.id);
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
 *    tags: [Dashboards]
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
 *      400:
 *        description: Update dashboard components failed due to bad request.
 *      500:
 *        description: Update dashboard components failed for no reason.
 */
router.patch(
  "/:id/components",
  validate(updateDashboardComponentsSchema),
  async (
    req: Request<{ id: string }, any, UpdateDashboardComponentsDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await services.updateDashboardComponents(
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
