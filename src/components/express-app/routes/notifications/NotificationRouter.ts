import express, { NextFunction, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "inversify";
import winston from "winston";
import { Utilities } from "../../../commons/utilities/Utilities";
import { NotificiationService } from "../../../services/notifications/NotificationService";
import { Request } from "../../interfaces";
import { RouteUtilities } from "../../RouteUtilities";

@injectable()
export class NotificationRouter {
  private utilities: Utilities;
  private notificationService: NotificiationService;
  private routeUtilities: RouteUtilities;

  private logger: winston.Logger;

  private router!: Router;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(NotificiationService) notificationService: NotificiationService,
    @inject(RouteUtilities) routeUtilities: RouteUtilities
  ) {
    this.utilities = utilities;
    this.notificationService = notificationService;
    this.routeUtilities = routeUtilities;

    this.logger = utilities.getLogger("notification-router");

    this.instanciateRouter();

    this.logger.info("constructed.");
  }

  private instanciateRouter() {
    this.router = express.Router();

    /**
     * @swagger
     * /notifications:
     *  get:
     *    summary: Get the user's notification.
     *    tags: [Notification]
     *    responses:
     *      200:
     *        description: Returns the user's notification.
     *      401:
     *        description: Unauthorized.
     */
    this.router.get(
      "/",
      this.routeUtilities.authenticateJWT(),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const userNotifications =
            await this.notificationService.getUserNotifications(req.user?.id!);
          res.status(StatusCodes.OK).send(userNotifications);
        } catch (error) {
          next(error);
        }
      }
    );

    /**
     * @swagger
     * /notifications/{id}/read:
     *  get:
     *    summary: Mark the user's notification as read.
     *    tags: [Notification]
     *    parameters:
     *      - $ref: '#/components/parameters/UserNotificationId'
     *    responses:
     *      200:
     *        description: Return the read user's notification.
     *      401:
     *        description: Unauthorized.
     *      404:
     *        description: User's notification was not found.
     */
    this.router.get(
      "/:id/read",
      this.routeUtilities.authenticateJWT(),
      async (
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
      ) => {
        try {
          const userNotification =
            await this.notificationService.markUserNotificationAsRead(
              req.params.id
            );
          res.status(StatusCodes.OK).send(userNotification);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  public getRouterInstance() {
    return this.router;
  }
}
