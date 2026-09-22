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
  removeShift,
  updateShift,
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

  const result = await updateShift(
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

  const result = await removeShift(
    req.auth.storeId,
    req.params.id,
    req.auth.membershipId,
  );

  res.status(200).json({
    status: "success",
    message:
      result.action === "DELETED"
        ? "Draft shift deleted successfully"
        : "Published shift cancelled successfully",
  });
}