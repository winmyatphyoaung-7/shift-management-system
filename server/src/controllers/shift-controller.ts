import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type { CreateShiftsBody } from "../schemas/schedule-schema.js";
import { createDraftShifts } from "../services/shift-service.js";

type CreateShiftsRequest = Request<
  Record<string, never>,
  unknown,
  CreateShiftsBody
>;

export async function createShiftsController(
  req: CreateShiftsRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const result = await createDraftShifts(
    req.auth.storeId,
    req.auth.membershipId,
    req.body,
  );

  res.status(201).json({
    status: "success",
    data: result,
  });
}