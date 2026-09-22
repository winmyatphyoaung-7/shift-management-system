import { Router } from "express";

import { updateCoverageRequirementController } from "../controllers/coverage-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireManager } from "../middleware/require-manager.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import { validateBody } from "../middleware/validate-body.js";
import { validateParams } from "../middleware/validate-params.js";
import {
  coverageRequirementIdParamsSchema,
  updateCoverageRequirementBodySchema,
} from "../schemas/schedule-schema.js";

export const coverageRouter = Router();

coverageRouter.patch(
  "/:id",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateParams(
    coverageRequirementIdParamsSchema,
  ),
  validateBody(
    updateCoverageRequirementBodySchema,
  ),
  updateCoverageRequirementController,
);