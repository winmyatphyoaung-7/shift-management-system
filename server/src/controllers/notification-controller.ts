import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type {
  NotificationIdParams,
} from "../schemas/notification-schema.js";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification-service.js";

type MarkNotificationReadRequest =
  Request<NotificationIdParams>;

export async function listNotificationsController(
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

  const result = await listNotifications(
    req.auth.userId,
    req.auth.storeId,
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
}

export async function markNotificationReadController(
  req: MarkNotificationReadRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const notification =
    await markNotificationRead(
      req.auth.userId,
      req.auth.storeId,
      req.params.id,
    );

  res.status(200).json({
    status: "success",
    data: {
      notification,
    },
  });
}

export async function markAllNotificationsReadController(
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

  const result =
    await markAllNotificationsRead(
      req.auth.userId,
      req.auth.storeId,
    );

  res.status(200).json({
    status: "success",
    data: result,
  });
}