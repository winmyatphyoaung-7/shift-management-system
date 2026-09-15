import { Router } from "express";

import {
  createMemberController,
  listMembersController,
} from "../controllers/member-controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireManager } from "../middleware/require-manager.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import { validateBody } from "../middleware/validate-body.js";
import { createMemberBodySchema } from "../schemas/member-schema.js";

export const memberRouter = Router();

memberRouter.get(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  listMembersController,
);

memberRouter.post(
  "/",
  requireAuth,
  requirePasswordChanged,
  requireManager,
  validateBody(createMemberBodySchema),
  createMemberController,
);