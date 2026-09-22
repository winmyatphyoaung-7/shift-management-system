import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type {
  ListScheduleDaysQuery,
  PublishScheduleDaysBody,
} from "../schemas/schedule-schema.js";
import {
  listScheduleDays,
  publishScheduleDays,
} from "../services/schedule-service.js";

type PublishScheduleDaysRequest =
  Request<
    Record<string, never>,
    unknown,
    PublishScheduleDaysBody
  >;

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

export async function publishScheduleDaysController(
  req: PublishScheduleDaysRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const result =
    await publishScheduleDays(
      req.auth.storeId,
      req.auth.membershipId,
      req.body,
    );

  res.status(200).json({
    status: "success",
    data: result,
  });
}