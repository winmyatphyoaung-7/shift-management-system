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