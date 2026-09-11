import type { AuthenticatedMember } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedMember;
    }
  }
}

export {};