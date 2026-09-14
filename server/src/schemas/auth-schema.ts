import { z } from "zod";

export const loginBodySchema = z.object({
  loginId: z
    .string()
    .regex(
      /^\d{3}$/,
      "Login ID must contain exactly three digits",
    ),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginBody = z.infer<
  typeof loginBodySchema
>;

const newPasswordSchema = z
  .string()
  .min(
    12,
    "New password must contain at least 12 characters",
  )
  .refine(
    (password) =>
      Buffer.byteLength(password, "utf8") <= 72,
    "New password must not exceed 72 bytes",
  );

export const changePasswordBodySchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),

    newPassword: newPasswordSchema,

    confirmPassword: z
      .string()
      .min(1, "Password confirmation is required"),
  })
  .refine(
    (data) =>
      data.newPassword === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Password confirmation does not match",
    },
  )
  .refine(
    (data) =>
      data.currentPassword !== data.newPassword,
    {
      path: ["newPassword"],
      message:
        "New password must be different from the current password",
    },
  );

export type ChangePasswordBody = z.infer<
  typeof changePasswordBodySchema
>;