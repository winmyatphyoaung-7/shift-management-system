import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type {
  ListScheduleDaysQuery,
  PublishScheduleDaysBody,
  CopyWeekBody,
  ClearDraftRangeBody,
} from "../schemas/schedule-schema.js";
import {
  listScheduleDays,
  publishScheduleDays,
} from "../services/schedule-service.js";
import { copyScheduleWeek } from "../services/copy-week-service.js";
import { clearDraftRange } from "../services/clear-draft-range-service.js";

type PublishScheduleDaysRequest =
  Request<
    Record<string, never>,
    unknown,
    PublishScheduleDaysBody
  >;
type CopyWeekRequest = Request<
  Record<string, never>,
  unknown,
  CopyWeekBody
>;
type ClearDraftRangeRequest = Request<
  Record<string, never>,
  unknown,
  ClearDraftRangeBody
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

export async function copyWeekController(
  req: CopyWeekRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const result = await copyScheduleWeek(
    req.auth.storeId,
    req.auth.membershipId,
    req.body,
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
}
export async function clearDraftRangeController(
  req: ClearDraftRangeRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const result = await clearDraftRange(
    req.auth.storeId,
    req.body,
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
}