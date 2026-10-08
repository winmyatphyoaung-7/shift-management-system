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

export const createManagerCoverageRequestBodySchema =
  createStaffCoverageRequestBodySchema.extend({
    responseDeadline: z
      .string()
      .datetime({
        offset: true,
      }),
  });

export type CreateManagerCoverageRequestBody =
  z.infer<
    typeof createManagerCoverageRequestBodySchema
  >;

export const COVERAGE_REQUEST_STATUSES = [
  "PENDING_REVIEW",
  "OPEN",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
] as const;

export const listManagerCoverageRequestsQuerySchema = z
  .object({
    status: z.enum(COVERAGE_REQUEST_STATUSES).optional(),
  })
  .strict();

export type ListManagerCoverageRequestsQuery = z.infer<
  typeof listManagerCoverageRequestsQuerySchema
>;

export const coverageRequestIdParamsSchema = z
  .object({
    id: z.uuid(
      "Coverage request ID must be a valid UUID",
    ),
  })
  .strict();

export type CoverageRequestIdParams = z.infer<
  typeof coverageRequestIdParamsSchema
>;

export const approveCoverageRequestBodySchema = z
  .object({
    responseDeadline: z
      .string()
      .datetime({
        offset: true,
      }),
  })
  .strict();

export type ApproveCoverageRequestBody = z.infer<
  typeof approveCoverageRequestBodySchema
>;

export const rejectCoverageRequestBodySchema = z
  .object({
    rejectionNote: z
      .string()
      .trim()
      .max(
        500,
        "Rejection note must not exceed 500 characters",
      )
      .optional(),
  })
  .strict();

export type RejectCoverageRequestBody = z.infer<
  typeof rejectCoverageRequestBodySchema
>;

export const sendDirectOffersBodySchema = z
  .object({
    membershipIds: z
      .array(
        z.uuid(
          "Membership ID must be a valid UUID",
        ),
      )
      .min(
        1,
        "At least one membership ID is required",
      )
      .refine(
        (membershipIds) =>
          new Set(membershipIds).size ===
          membershipIds.length,
        "Membership IDs must be unique",
      ),
  })
  .strict();

export type SendDirectOffersBody = z.infer<
  typeof sendDirectOffersBodySchema
>;