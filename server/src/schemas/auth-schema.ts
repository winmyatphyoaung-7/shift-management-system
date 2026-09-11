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