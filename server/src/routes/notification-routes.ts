import { Router } from "express";

import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from "../controllers/notification-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import { validateParams } from "../middleware/validate-params.js";
import {
  notificationIdParamsSchema,
} from "../schemas/notification-schema.js";

export const notificationRouter =
  Router();

notificationRouter.get(
  "/",
  requireAuth,
  requirePasswordChanged,
  listNotificationsController,
);

notificationRouter.patch(
  "/read-all",
  requireAuth,
  requirePasswordChanged,
  markAllNotificationsReadController,
);

notificationRouter.patch(
  "/:id/read",
  requireAuth,
  requirePasswordChanged,
  validateParams(
    notificationIdParamsSchema,
  ),
  markNotificationReadController,
);