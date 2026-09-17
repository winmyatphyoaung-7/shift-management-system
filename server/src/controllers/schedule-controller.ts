import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type { ListScheduleDaysQuery } from "../schemas/schedule-schema.js";
import { listScheduleDays } from "../services/schedule-service.js";

export async function listScheduleDaysController(
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

  const query = res.locals[
    "validatedQuery"
  ] as ListScheduleDaysQuery;

  const includeDrafts =
    req.auth.role === "MANAGER";

  const scheduleDays =
    await listScheduleDays(
      req.auth.storeId,
      query,
      includeDrafts,
    );

  res.status(200).json({
    status: "success",
    data: {
      scheduleDays,
    },
  });
}