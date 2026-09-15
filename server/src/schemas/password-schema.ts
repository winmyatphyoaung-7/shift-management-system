import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(
    12,
    "Password must contain at least 12 characters",
  )
  .refine(
    (password) =>
      Buffer.byteLength(password, "utf8") <= 72,
    "Password must not exceed 72 bytes",
  );