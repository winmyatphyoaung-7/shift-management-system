import type { RequestHandler } from "express";

import { AppError } from "../errors/app-error.js";

export const requirePasswordChanged: RequestHandler = (
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

  if (req.auth.mustChangePassword) {
    next(
      new AppError(
        403,
        "PASSWORD_CHANGE_REQUIRED",
        "Password change is required",
      ),
    );
    return;
  }

  next();
};