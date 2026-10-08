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
  SendDirectOffersBody,
} from "../schemas/coverage-request-schema.js";
import {
  approveAndOpenCoverageRequest,
  createStaffCoverageRequest,
  listManagerCoverageRequests,
  rejectCoverageRequest,
  createManagerCoverageRequest,
  listPublicCoverageRequests,
  volunteerForCoverageRequest,
  withdrawCoverageResponse,
  sendDirectOffers,
  acceptDirectOffer,
  declineDirectOffer,
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

type VolunteerCoverageRequest = Request<
  CoverageRequestIdParams
>;

type WithdrawCoverageResponseRequest =
  Request<CoverageRequestIdParams>;

type SendDirectOffersRequest = Request<
  CoverageRequestIdParams,
  unknown,
  SendDirectOffersBody
>;

type DirectOfferActionRequest =
  Request<CoverageRequestIdParams>;

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

export async function listPublicCoverageRequestsController(
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

  const coverageRequests =
    await listPublicCoverageRequests(
      req.auth.storeId,
      req.auth.membershipId,
    );

  res.status(200).json({
    status: "success",
    data: {
      coverageRequests,
    },
  });
}

export async function volunteerForCoverageRequestController(
  req: VolunteerCoverageRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const candidate =
    await volunteerForCoverageRequest(
      req.auth.storeId,
      req.auth.membershipId,
      req.params.id,
    );

  res.status(201).json({
    status: "success",
    data: {
      candidate,
    },
  });
}

export async function withdrawCoverageResponseController(
  req: WithdrawCoverageResponseRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const candidate =
    await withdrawCoverageResponse(
      req.auth.storeId,
      req.auth.membershipId,
      req.params.id,
    );

  res.status(200).json({
    status: "success",
    data: {
      candidate,
    },
  });
}

export async function sendDirectOffersController(
  req: SendDirectOffersRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const candidates =
    await sendDirectOffers(
      req.auth.storeId,
      req.params.id,
      req.body,
    );

  res.status(201).json({
    status: "success",
    data: {
      candidates,
    },
  });
}

export async function acceptDirectOfferController(
  req: DirectOfferActionRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const candidate =
    await acceptDirectOffer(
      req.auth.storeId,
      req.auth.membershipId,
      req.params.id,
    );

  res.status(200).json({
    status: "success",
    data: {
      candidate,
    },
  });
}

export async function declineDirectOfferController(
  req: DirectOfferActionRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const candidate =
    await declineDirectOffer(
      req.auth.storeId,
      req.auth.membershipId,
      req.params.id,
    );

  res.status(200).json({
    status: "success",
    data: {
      candidate,
    },
  });
}