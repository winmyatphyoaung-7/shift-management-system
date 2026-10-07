import { z } from "zod";

export const REASON_CATEGORIES = [
  "HEALTH",
  "SCHOOL",
  "PERSONAL",
  "OTHER",
] as const;

export const createStaffCoverageRequestBodySchema =
  z
    .object({
      shiftId: z.uuid(
        "Shift ID must be a valid UUID",
      ),

      reasonCategory: z.enum(
        REASON_CATEGORIES,
      ),

      reasonDetails: z
        .string()
        .trim()
        .max(
          1000,
          "Reason details must not exceed 1000 characters",
        )
        .optional(),
    })
    .strict();

export type CreateStaffCoverageRequestBody =
  z.infer<
    typeof createStaffCoverageRequestBodySchema
  >;