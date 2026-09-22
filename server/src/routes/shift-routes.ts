import { Router } from "express";

import {
  createShiftsController,
  deleteShiftController,
  updateShiftController,
} from "../controllers/shift-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireManager } from "../middleware/require-manager.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import { validateBody } from "../middleware/validate-body.js";
import { validateParams } from "../middleware/validate-params.js";
import {
  createShiftsBodySchema,
  shiftIdParamsSchema,
  updateShiftBodySchema,
} from "../schemas/schedule-schema.js";

export const shiftRouter = Router();

shiftRouter.post(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateBody(createShiftsBodySchema),
  createShiftsController,
);

shiftRouter.patch(
  "/:id",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateParams(shiftIdParamsSchema),
  validateBody(updateShiftBodySchema),
  updateShiftController,
);

shiftRouter.delete(
  "/:id",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateParams(shiftIdParamsSchema),
  deleteShiftController,
);