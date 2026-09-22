import { z } from "zod";

export const scheduleDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD format",
  )
  .refine(
    (value) => {
      const date = new Date(
        `${value}T00:00:00.000Z`,
      );

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) ===
        value
      );
    },
    "Date must be a valid calendar date",
  );

export const listScheduleDaysQuerySchema = z
  .object({
    from: scheduleDateSchema,
    to: scheduleDateSchema,
  })
  .strict()
  .refine(
    (data) => data.from <= data.to,
    {
      path: ["to"],
      message:
        "The to date must be on or after the from date",
    },
  );

export type ListScheduleDaysQuery = z.infer<
  typeof listScheduleDaysQuerySchema
>;

export const publishScheduleDaysBodySchema =
  listScheduleDaysQuerySchema;

export type PublishScheduleDaysBody =
  z.infer<
    typeof publishScheduleDaysBodySchema
  >;

const absoluteDateTimeSchema = z
  .string()
  .datetime({
    offset: true,
  });

export const createShiftsBodySchema = z
  .object({
    scheduleDate: scheduleDateSchema,

    shiftPresetId: z
      .string()
      .uuid()
      .optional(),

    assigneeMembershipIds: z
      .array(z.string().uuid())
      .min(
        1,
        "At least one assignee is required",
      )
      .refine(
        (membershipIds) =>
          new Set(membershipIds).size ===
          membershipIds.length,
        "Assignee membership IDs must be unique",
      ),

    startAt: absoluteDateTimeSchema,
    endAt: absoluteDateTimeSchema,

    note: z
      .string()
      .trim()
      .max(
        500,
        "Note must not exceed 500 characters",
      )
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      new Date(data.endAt).getTime() >
      new Date(data.startAt).getTime(),
    {
      path: ["endAt"],
      message:
        "Shift end time must be after start time",
    },
  );

export type CreateShiftsBody = z.infer<
  typeof createShiftsBodySchema
>;

export const shiftIdParamsSchema = z
  .object({
    id: z
      .string()
      .uuid(
        "Shift ID must be a valid UUID",
      ),
  })
  .strict();

export type ShiftIdParams = z.infer<
  typeof shiftIdParamsSchema
>;

export const updateShiftBodySchema = z
  .object({
    assigneeMembershipId: z
      .string()
      .uuid()
      .optional(),

    shiftPresetId: z
      .string()
      .uuid()
      .nullable()
      .optional(),

    startAt:
      absoluteDateTimeSchema.optional(),

    endAt:
      absoluteDateTimeSchema.optional(),

    note: z
      .string()
      .trim()
      .max(
        500,
        "Note must not exceed 500 characters",
      )
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "At least one shift field is required",
    },
  )
  .refine(
    (data) =>
      !data.startAt ||
      !data.endAt ||
      new Date(data.endAt).getTime() >
      new Date(data.startAt).getTime(),
    {
      path: ["endAt"],
      message:
        "Shift end time must be after start time",
    },
  );

export type UpdateShiftBody = z.infer<
  typeof updateShiftBodySchema
>;

export const coverageRequirementIdParamsSchema =
  z
    .object({
      id: z
        .string()
        .uuid(
          "Coverage requirement ID must be a valid UUID",
        ),
    })
    .strict();

export type CoverageRequirementIdParams =
  z.infer<
    typeof coverageRequirementIdParamsSchema
  >;

export const updateCoverageRequirementBodySchema =
  z
    .object({
      requiredCount: z
        .number()
        .int(
          "Required count must be an integer",
        )
        .min(
          1,
          "Required count must be at least 1",
        ),
    })
    .strict();

export type UpdateCoverageRequirementBody =
  z.infer<
    typeof updateCoverageRequirementBodySchema
  >;

const mondayScheduleDateSchema =
  scheduleDateSchema.refine(
    (value) =>
      new Date(
        `${value}T00:00:00.000Z`,
      ).getUTCDay() === 1,
    "Week start date must be a Monday",
  );

const ONE_WEEK_IN_MILLISECONDS =
  7 * 24 * 60 * 60 * 1000;

export const copyWeekBodySchema = z
  .object({
    sourceWeekStart:
      mondayScheduleDateSchema,

    targetWeekStart:
      mondayScheduleDateSchema,

    confirmed: z
      .boolean()
      .default(false),
  })
  .strict()
  .refine(
    (data) => {
      const sourceTime = new Date(
        `${data.sourceWeekStart}T00:00:00.000Z`,
      ).getTime();

      const targetTime = new Date(
        `${data.targetWeekStart}T00:00:00.000Z`,
      ).getTime();

      return (
        targetTime - sourceTime ===
        ONE_WEEK_IN_MILLISECONDS
      );
    },
    {
      path: ["targetWeekStart"],
      message:
        "Target week must start exactly seven days after the source week",
    },
  );

export type CopyWeekBody = z.infer<
  typeof copyWeekBodySchema
>;