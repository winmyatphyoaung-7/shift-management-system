import { Router } from "express";

import {
  createStaffCoverageRequestController,
  listManagerCoverageRequestsController,
  approveAndOpenCoverageRequestController,
  rejectCoverageRequestController,
  createManagerCoverageRequestController,
  listPublicCoverageRequestsController,
  volunteerForCoverageRequestController,
  withdrawCoverageResponseController,
  sendDirectOffersController,
  acceptDirectOfferController,
  declineDirectOfferController,
  finalApproveCoverageRequestController,
  cancelCoverageRequestController,
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
  createManagerCoverageRequestBodySchema,
  sendDirectOffersBodySchema,
  finalApproveCoverageRequestBodySchema,
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
  "/manager",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateBody(
    createManagerCoverageRequestBodySchema,
  ),
  createManagerCoverageRequestController,
);

coverageRequestRouter.post(
  "/:id/direct-offers",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateParams(
    coverageRequestIdParamsSchema,
  ),
  validateBody(
    sendDirectOffersBodySchema,
  ),
  sendDirectOffersController,
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
  "/:id/final-approve",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateParams(
    coverageRequestIdParamsSchema,
  ),
  validateBody(
    finalApproveCoverageRequestBodySchema,
  ),
  finalApproveCoverageRequestController,
);

coverageRequestRouter.post(
  "/:id/cancel",
  requireAuth,
  requirePasswordChanged,
  validateParams(
    coverageRequestIdParamsSchema,
  ),
  cancelCoverageRequestController,
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
  "/:id/direct-offer/accept",
  requireAuth,
  requirePasswordChanged,
  requireStaff,
  validateParams(
    coverageRequestIdParamsSchema,
  ),
  acceptDirectOfferController,
);

coverageRequestRouter.post(
  "/:id/direct-offer/decline",
  requireAuth,
  requirePasswordChanged,
  requireStaff,
  validateParams(
    coverageRequestIdParamsSchema,
  ),
  declineDirectOfferController,
);

coverageRequestRouter.post(
  "/:id/volunteer",
  requireAuth,
  requirePasswordChanged,
  requireStaff,
  validateParams(
    coverageRequestIdParamsSchema,
  ),
  volunteerForCoverageRequestController,
);

coverageRequestRouter.post(
  "/:id/withdraw",
  requireAuth,
  requirePasswordChanged,
  requireStaff,
  validateParams(
    coverageRequestIdParamsSchema,
  ),
  withdrawCoverageResponseController,
);

coverageRequestRouter.get(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireStaff,
  listPublicCoverageRequestsController,
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