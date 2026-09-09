import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (
  req,
  res,
) => {
  res.status(404).json({
    status: "error",
    code: "ROUTE_NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};