import type { RequestHandler } from "express";

import { AppError } from "../errors/app-error.js";

export const requireStaff: RequestHandler = (
  req,
  _res,
  next,
) => {
  if (!req.auth) {
    next(
      new AppError(
        401,
        "UNAUTHORIZED",
        "Authentication is required",
      ),
    );
    return;
  }

  if (req.auth.role !== "STAFF") {
    next(
      new AppError(
        403,
        "FORBIDDEN",
        "Staff access is required",
      ),
    );
    return;
  }

  next();
};