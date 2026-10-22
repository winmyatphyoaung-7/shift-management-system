import { Router } from "express";

import {
  getManagerDashboardController,
  getStaffDashboardController,
} from "../controllers/dashboard-controller.js";
import { requireManager } from "../middleware/require-manager.js";
import { requireStaff } from "../middleware/require-staff.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/staff",
  requireAuth,
  requirePasswordChanged,
  requireStaff,
  getStaffDashboardController,
);

dashboardRouter.get(
  "/manager",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  getManagerDashboardController,
);