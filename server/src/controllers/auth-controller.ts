import type { Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import type { LoginBody } from "../schemas/auth-schema.js";
import { authenticateMember } from "../services/auth-service.js";
import { createAuthToken } from "../services/token-service.js";
import {clearAuthCookie,setAuthCookie,} from "../utils/auth-cookie.js";

type LoginRequest = Request<
  Record<string, never>,
  unknown,
  LoginBody
>;

export async function loginController(
  req: LoginRequest,
  res: Response,
): Promise<void> {
  const { loginId, password } = req.body;

  const member = await authenticateMember(
    loginId,
    password,
  );
   // ../services/auth-service.js မှာရေးထားတဲ့ authenticateMember() function က loginId နဲ့ password ကို database ထဲမှာ ရှာပြီး member object ကို return ပြန်ပေးတယ်။

  if (!member) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid login ID or password",
    );
  }

  const token = createAuthToken({
    userId: member.userId,
    membershipId: member.membershipId,
    storeId: member.storeId,
    role: member.role,
  });   // ../services/token-service.js မှာရေးထားတဲ့ createAuthToken()token တစ်ခု ထုတ်ပေးတယ်။

  setAuthCookie(res, token);

  res.status(200).json({
    status: "success",
    data: {
      member,
    },
  });
}

export function getCurrentMemberController(
  req: Request,
  res: Response,
): void {
  if (!req.auth) {
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      member: req.auth,
    },
  });
}

export function logoutController(
  _req: Request,
  res: Response,
): void {
  clearAuthCookie(res);

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
}