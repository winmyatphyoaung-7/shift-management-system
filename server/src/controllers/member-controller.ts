import type {
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import type {
  CreateMemberBody,
  MemberIdParams,
  ResetMemberPasswordBody,
  UpdateMemberBody,
} from "../schemas/member-schema.js";
import {
  createStaffMember,
  listStoreMembers,
  resetStaffMemberPassword,
  updateStoreMember,
} from "../services/member-service.js";

type CreateMemberRequest = Request<
  Record<string, never>,
  unknown,
  CreateMemberBody
>;
type UpdateMemberRequest = Request<
  MemberIdParams,
  unknown,
  UpdateMemberBody
>;
type ResetMemberPasswordRequest = Request<
  MemberIdParams,
  unknown,
  ResetMemberPasswordBody
>;

export async function listMembersController(
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

  const members = await listStoreMembers(
    req.auth.storeId,
  );

  res.status(200).json({
    status: "success",
    data: {
      members,
    },
  });
}

export async function createMemberController(
  req: CreateMemberRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const member = await createStaffMember(
    req.auth.storeId,
    {
      name: req.body.name,
      loginId: req.body.loginId,
      temporaryPassword:
        req.body.temporaryPassword,
      colorKey: req.body.colorKey,
    },
  );

  res.status(201).json({
    status: "success",
    data: {
      member,
    },
  });
}

export async function updateMemberController(
  req: UpdateMemberRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  const member = await updateStoreMember(
    req.auth.storeId,
    req.params.id,
    req.body,
  );

  res.status(200).json({
    status: "success",
    data: {
      member,
    },
  });
}

export async function resetMemberPasswordController(
  req: ResetMemberPasswordRequest,
  res: Response,
): Promise<void> {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  await resetStaffMemberPassword(
    req.auth.storeId,
    req.params.id,
    req.body.temporaryPassword,
  );

  res.status(200).json({
    status: "success",
    message:
      "Member password reset successfully",
  });
}