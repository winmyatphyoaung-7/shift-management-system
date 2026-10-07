import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type {
  CreateStaffCoverageRequestBody,
} from "../schemas/coverage-request-schema.js";
import {
  createStaffCoverageRequest,
} from "../services/coverage-request-service.js";

type CreateStaffCoverageRequest =
  Request<
    Record<string, never>,
    unknown,
    CreateStaffCoverageRequestBody
  >;

export async function createStaffCoverageRequestController(
  req: CreateStaffCoverageRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const coverageRequest =
    await createStaffCoverageRequest(
      req.auth.storeId,
      req.auth.membershipId,
      req.body,
    );

  res.status(201).json({
    status: "success",
    data: {
      coverageRequest,
    },
  });
}