import type { RequestHandler } from "express";

import { authConfig } from "../config/auth.js";
import { AppError } from "../errors/app-error.js";
import { findCurrentAuthMember } from "../services/auth-service.js";
import {
  type AuthTokenPayload,
  verifyAuthToken,
} from "../services/token-service.js";

export const requireAuth: RequestHandler = async (
  req,
  _res,
  next,
) => {
  const token: unknown =
    req.cookies?.[authConfig.cookieName];

  if (typeof token !== "string") {
    next(
      new AppError(
        401,
        "UNAUTHORIZED",
        "Authentication is required",
      ),
    );
    return;
  }

  let payload: AuthTokenPayload;

  try {
    payload = verifyAuthToken(token);
  } catch {
    next(
      new AppError(
        401,
        "UNAUTHORIZED",
        "Authentication is required",
      ),
    );
    return;
  }

  const currentMember =
    await findCurrentAuthMember(payload);

  if (!currentMember) {
    next(
      new AppError(
        401,
        "UNAUTHORIZED",
        "Authentication is required",
      ),
    );
    return;
  }

  req.auth = currentMember;
  next();
};