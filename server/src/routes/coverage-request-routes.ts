import { Router } from "express";

import {
  createStaffCoverageRequestController,
} from "../controllers/coverage-request-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import { requireStaff } from "../middleware/require-staff.js";
import { validateBody } from "../middleware/validate-body.js";
import {
  createStaffCoverageRequestBodySchema,
} from "../schemas/coverage-request-schema.js";

export const coverageRequestRouter =
  Router();

coverageRequestRouter.post(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireStaff,
  validateBody(
    createStaffCoverageRequestBodySchema,
  ),
  createStaffCoverageRequestController,
);