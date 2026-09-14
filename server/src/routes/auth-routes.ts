import { Router } from "express";

import {
  changePasswordController,
  getCurrentMemberController,
  loginController,
  logoutController,
} from "../controllers/auth-controller.js";

import { loginRateLimiter } from "../middleware/login-rate-limit.js";
import { validateBody } from "../middleware/validate-body.js";

import {
  changePasswordBodySchema,
  loginBodySchema,
} from "../schemas/auth-schema.js";

import { requireAuth } from "../middleware/require-auth.js";


export const authRouter = Router();

authRouter.post(
  "/login",
  loginRateLimiter,
  validateBody(loginBodySchema),
  loginController,
);

authRouter.get(
  "/me",
  requireAuth,
  getCurrentMemberController,
);

authRouter.post(
  "/change-password",
  requireAuth,
  validateBody(changePasswordBodySchema),
  changePasswordController,
);

authRouter.post(
  "/logout",
  logoutController,
);
