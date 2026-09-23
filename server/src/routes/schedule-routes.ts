import { Router } from "express";

import {
  listScheduleDaysController,
  publishScheduleDaysController,
  copyWeekController,
  clearDraftRangeController,
} from "../controllers/schedule-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import { validateQuery } from "../middleware/validate-query.js";
import { requireManager } from "../middleware/require-manager.js";
import { validateBody } from "../middleware/validate-body.js";
import {
  listScheduleDaysQuerySchema,
  publishScheduleDaysBodySchema,
  copyWeekBodySchema,
  clearDraftRangeBodySchema,
} from "../schemas/schedule-schema.js";

export const scheduleRouter = Router();

scheduleRouter.get(
  "/",
  requireAuth,
  requirePasswordChanged,
  validateQuery(
    listScheduleDaysQuerySchema,
  ),
  listScheduleDaysController,
);

scheduleRouter.post(
  "/publish",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateBody(
    publishScheduleDaysBodySchema,
  ),
  publishScheduleDaysController,
);

scheduleRouter.post(
  "/copy-week",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateBody(copyWeekBodySchema),
  copyWeekController,
);

scheduleRouter.delete(
  "/draft-range",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateBody(
    clearDraftRangeBodySchema,
  ),
  clearDraftRangeController,
);