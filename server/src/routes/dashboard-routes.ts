import { Router } from "express";

import {
  getManagerDashboardController,
  getStaffDashboardController,
} from "../controllers/dashboard-controller.js";
import { requireManager } from "../middleware/require-manager.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/staff",
  requireAuth,
  requirePasswordChanged,
  getStaffDashboardController,
);

dashboardRouter.get(
  "/manager",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  getManagerDashboardController,
);