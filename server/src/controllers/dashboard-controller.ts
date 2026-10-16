import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import {
  getManagerDashboard,
  getStaffDashboard,
} from "../services/dashboard-service.js";


export async function getStaffDashboardController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const dashboard =
    await getStaffDashboard(
      req.auth.userId,
      req.auth.storeId,
      req.auth.membershipId,
    );

  res.status(200).json({
    status: "success",
    data: {
      dashboard,
    },
  });
}

export async function getManagerDashboardController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const dashboard =
    await getManagerDashboard(
      req.auth.userId,
      req.auth.storeId,
    );

  res.status(200).json({
    status: "success",
    data: {
      dashboard,
    },
  });
}