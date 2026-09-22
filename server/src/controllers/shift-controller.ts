import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type {
  CreateShiftsBody,
  ShiftIdParams,
  UpdateShiftBody,
} from "../schemas/schedule-schema.js";
import {
  createDraftShifts,
  deleteDraftShift,
  updateDraftShift,
} from "../services/shift-service.js";
type CreateShiftsRequest = Request<
  Record<string, never>,
  unknown,
  CreateShiftsBody
>;
type UpdateShiftRequest = Request<
  ShiftIdParams,
  unknown,
  UpdateShiftBody
>;
type DeleteShiftRequest = Request<
  ShiftIdParams
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
export async function updateShiftController(
  req: UpdateShiftRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const result = await updateDraftShift(
    req.auth.storeId,
    req.params.id,
    req.auth.membershipId,
    req.body,
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
}

export async function deleteShiftController(
  req: DeleteShiftRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  await deleteDraftShift(
    req.auth.storeId,
    req.params.id,
  );

  res.status(200).json({
    status: "success",
    message:
      "Draft shift deleted successfully",
  });
}