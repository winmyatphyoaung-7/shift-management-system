import { Router } from "express";

import {getCurrentMemberController, loginController, logoutController } from "../controllers/auth-controller.js";
import { loginRateLimiter } from "../middleware/login-rate-limit.js";
import { validateBody } from "../middleware/validate-body.js";
import { loginBodySchema } from "../schemas/auth-schema.js";
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
  "/logout",
  logoutController,
);