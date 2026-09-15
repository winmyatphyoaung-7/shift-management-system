import { z } from "zod";

import { passwordSchema } from "./password-schema.js";

export const MEMBER_COLOR_KEYS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "zinc",
  "stone",
] as const;

export const createMemberBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Member name is required")
      .max(
        100,
        "Member name must not exceed 100 characters",
      ),

    loginId: z
      .string()
      .regex(
        /^\d{3}$/,
        "Login ID must contain exactly three digits",
      ),

    temporaryPassword: passwordSchema,

    confirmPassword: z
      .string()
      .min(
        1,
        "Password confirmation is required",
      ),

    colorKey: z.enum(MEMBER_COLOR_KEYS),
  })
  .strict()
  .refine(
    (data) =>
      data.temporaryPassword ===
      data.confirmPassword,
    {
      path: ["confirmPassword"],
      message:
        "Password confirmation does not match",
    },
  );

export type CreateMemberBody = z.infer<
  typeof createMemberBodySchema
>;