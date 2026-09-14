import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";

import { AppError } from "../errors/app-error.js";
import { requireManager } from "../middleware/require-manager.js";
import { requirePasswordChanged } from "../middleware/require-password-changed.js";
import type { AuthenticatedMember } from "../types/auth.js";

const manager: AuthenticatedMember = {
  userId: "11111111-1111-4111-8111-111111111111",
  membershipId: "22222222-2222-4222-8222-222222222222",
  storeId: "33333333-3333-4333-8333-333333333333",
  loginId: "001",
  name: "Test Manager",
  role: "MANAGER",
  mustChangePassword: false,
};

const staff: AuthenticatedMember = {
  ...manager,
  role: "STAFF",
};

const temporaryPasswordManager: AuthenticatedMember = {
  ...manager,
  mustChangePassword: true,
};

function testMiddleware(
  label: string,
  middleware: RequestHandler,
  auth?: AuthenticatedMember,
): void {
  const req = {} as Request;
  const res = {} as Response;

  if (auth) {
    req.auth = auth;
  }

  const next: NextFunction = (error?: unknown) => {
    if (error instanceof AppError) {
      console.log(label, {
        allowed: false,
        statusCode: error.statusCode,
        code: error.code,
      });
      return;
    }

    console.log(label, {
      allowed: true,
    });
  };

  middleware(req, res, next);
}

testMiddleware(
  "No authentication",
  requireManager,
);

testMiddleware(
  "Password change required",
  requirePasswordChanged,
  temporaryPasswordManager,
);

testMiddleware(
  "Staff uses manager route",
  requireManager,
  staff,
);

testMiddleware(
  "Manager uses manager route",
  requireManager,
  manager,
);

testMiddleware(
  "Password already changed",
  requirePasswordChanged,
  manager,
);