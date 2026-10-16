import { Router } from "express";

import { getStaffDashboardController } from "../controllers/dashboard-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/staff",
  requireAuth,
  requirePasswordChanged,
  getStaffDashboardController,
);