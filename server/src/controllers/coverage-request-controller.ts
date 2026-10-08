import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type {
  ApproveCoverageRequestBody,
  CoverageRequestIdParams,
  CreateStaffCoverageRequestBody,
  ListManagerCoverageRequestsQuery,
  RejectCoverageRequestBody,
  CreateManagerCoverageRequestBody,
} from "../schemas/coverage-request-schema.js";
import {
  approveAndOpenCoverageRequest,
  createStaffCoverageRequest,
  listManagerCoverageRequests,
  rejectCoverageRequest,
  createManagerCoverageRequest,
} from "../services/coverage-request-service.js";

type CreateStaffCoverageRequest =
  Request<
    Record<string, never>,
    unknown,
    CreateStaffCoverageRequestBody
  >;
type ApproveCoverageRequest = Request<
  CoverageRequestIdParams,
  unknown,
  ApproveCoverageRequestBody
>;
type RejectCoverageRequest = Request<
  CoverageRequestIdParams,
  unknown,
  RejectCoverageRequestBody
>;
type CreateManagerCoverageRequest = Request<
  Record<string, never>,
  unknown,
  CreateManagerCoverageRequestBody
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

export async function listManagerCoverageRequestsController(
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
  ] as ListManagerCoverageRequestsQuery;

  const coverageRequests =
    await listManagerCoverageRequests(
      req.auth.storeId,
      query,
    );

  res.status(200).json({
    status: "success",
    data: {
      coverageRequests,
    },
  });
}

export async function approveAndOpenCoverageRequestController(
  req: ApproveCoverageRequest,
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
    await approveAndOpenCoverageRequest(
      req.auth.storeId,
      req.params.id,
      req.body,
    );

  res.status(200).json({
    status: "success",
    data: {
      coverageRequest,
    },
  });
}

export async function rejectCoverageRequestController(
  req: RejectCoverageRequest,
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
    await rejectCoverageRequest(
      req.auth.storeId,
      req.params.id,
      req.body,
    );

  res.status(200).json({
    status: "success",
    data: {
      coverageRequest,
    },
  });
}

export async function createManagerCoverageRequestController(
  req: CreateManagerCoverageRequest,
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
    await createManagerCoverageRequest(
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