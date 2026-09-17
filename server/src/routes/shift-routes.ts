import { Router } from "express";

import { createShiftsController } from "../controllers/shift-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireManager } from "../middleware/require-manager.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import { validateBody } from "../middleware/validate-body.js";
import { createShiftsBodySchema } from "../schemas/schedule-schema.js";

export const shiftRouter = Router();

shiftRouter.post(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateBody(createShiftsBodySchema),
  createShiftsController,
);