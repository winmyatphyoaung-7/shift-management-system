import type { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../errors/app-error.js";
import { createDateTimeInTimeZone } from "../utils/schedule-time.js";

type EnsureScheduleDayInput = {
  transaction: Prisma.TransactionClient;
  storeId: string;
  scheduleDate: string;
  timeZone: string;
};

export async function ensureScheduleDayWithCoverageRequirements(
  input: EnsureScheduleDayInput,
) {
  const activePresets =
    await input.transaction.shiftPreset.findMany({
      where: {
        storeId: input.storeId,
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        startMinute: true,
        endMinute: true,
        crossesMidnight: true,
        defaultRequiredCount: true,
      },
    });

  if (activePresets.length === 0) {
    throw new AppError(
      409,
      "SHIFT_PRESETS_NOT_CONFIGURED",
      "Active shift presets are required",
    );
  }

  const databaseScheduleDate = new Date(
    `${input.scheduleDate}T00:00:00.000Z`,
  );

  const scheduleDay =
    await input.transaction.scheduleDay.upsert({
      where: {
        storeId_scheduleDate: {
          storeId: input.storeId,
          scheduleDate:
            databaseScheduleDate,
        },
      },
      update: {},
      create: {
        storeId: input.storeId,
        scheduleDate:
          databaseScheduleDate,
      },
      select: {
        id: true,
        scheduleDate: true,
        status: true,
      },
    });

  await input.transaction.coverageRequirement.createMany(
    {
      data: activePresets.map(
        (preset) => ({
          scheduleDayId: scheduleDay.id,
          shiftPresetId: preset.id,

          startAt:
            createDateTimeInTimeZone(
              input.scheduleDate,
              preset.startMinute,
              input.timeZone,
            ),

          endAt:
            createDateTimeInTimeZone(
              input.scheduleDate,
              preset.endMinute,
              input.timeZone,
              preset.crossesMidnight
                ? 1
                : 0,
            ),

          requiredCount:
            preset.defaultRequiredCount,
        }),
      ),
      skipDuplicates: true,
    },
  );

  return {
    scheduleDay,
    activePresets,
  };
}