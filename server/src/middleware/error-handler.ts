import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400 &&
    "body" in error
  ) {
    res.status(400).json({
      status: "error",
      code: "INVALID_JSON",
      message: "Request body contains invalid JSON",
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: "error",
      code: error.code,
      message: error.message,
      ...(error.details !== undefined
        ? { details: error.details }
        : {}),
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};