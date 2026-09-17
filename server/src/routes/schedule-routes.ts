import { Router } from "express";

import { listScheduleDaysController } from "../controllers/schedule-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import { validateQuery } from "../middleware/validate-query.js";
import { listScheduleDaysQuerySchema } from "../schemas/schedule-schema.js";

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