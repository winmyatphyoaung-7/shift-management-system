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

const memberNameSchema = z
  .string()
  .trim()
  .min(1, "Member name is required")
  .max(
    100,
    "Member name must not exceed 100 characters",
  );

const memberLoginIdSchema = z
  .string()
  .regex(
    /^\d{3}$/,
    "Login ID must contain exactly three digits",
  );

const memberColorKeySchema = z.enum(
  MEMBER_COLOR_KEYS,
);

export const createMemberBodySchema = z
  .object({
    name: memberNameSchema,
    loginId: memberLoginIdSchema,
    temporaryPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(
        1,
        "Password confirmation is required",
      ),
    colorKey: memberColorKeySchema,
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

export const updateMemberBodySchema = z
  .object({
    name: memberNameSchema.optional(),
    loginId: memberLoginIdSchema.optional(),
    colorKey: memberColorKeySchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "At least one editable member field is required",
    },
  );

export type UpdateMemberBody = z.infer<
  typeof updateMemberBodySchema
>;

export const memberIdParamsSchema = z
  .object({
    id: z.uuid(),
  })
  .strict();

export type MemberIdParams = z.infer<
  typeof memberIdParamsSchema
>;

export const resetMemberPasswordBodySchema = z
  .object({
    temporaryPassword: passwordSchema,

    confirmPassword: z
      .string()
      .min(
        1,
        "Password confirmation is required",
      ),
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

export type ResetMemberPasswordBody = z.infer<
  typeof resetMemberPasswordBodySchema
>;