import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { AppError } from "../errors/app-error.js";

export function validateQuery(
  schema: ZodType,
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(
      req.query,
    );

    if (!result.success) {
      next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Request query validation failed",
          result.error.issues,
        ),
      );
      return;
    }

    res.locals["validatedQuery"] =
      result.data;

    next();
  };
}