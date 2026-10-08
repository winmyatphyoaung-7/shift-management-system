import { Router } from "express";

import {
  createStaffCoverageRequestController,
  listManagerCoverageRequestsController,
  approveAndOpenCoverageRequestController,
  rejectCoverageRequestController,
} from "../controllers/coverage-request-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import { requireStaff } from "../middleware/require-staff.js";
import { validateBody } from "../middleware/validate-body.js";
import { requireManager } from "../middleware/require-manager.js";
import { validateQuery } from "../middleware/validate-query.js";
import { validateParams } from "../middleware/validate-params.js";
import {
  createStaffCoverageRequestBodySchema,
  listManagerCoverageRequestsQuerySchema,
  approveCoverageRequestBodySchema,
  coverageRequestIdParamsSchema,
  rejectCoverageRequestBodySchema,
} from "../schemas/coverage-request-schema.js";

export const coverageRequestRouter =
  Router();


coverageRequestRouter.get(
  "/manager",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateQuery(
    listManagerCoverageRequestsQuerySchema,
  ),
  listManagerCoverageRequestsController,
);

coverageRequestRouter.post(
  "/:id/approve-open",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateParams(
    coverageRequestIdParamsSchema,
  ),
  validateBody(
    approveCoverageRequestBodySchema,
  ),
  approveAndOpenCoverageRequestController,
);

coverageRequestRouter.post(
  "/:id/reject",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateParams(
    coverageRequestIdParamsSchema,
  ),
  validateBody(
    rejectCoverageRequestBodySchema,
  ),
  rejectCoverageRequestController,
);

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