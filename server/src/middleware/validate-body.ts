import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error.js";

export function validateBody(
  schema: ZodType,
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Request validation failed",
          result.error.issues,
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}