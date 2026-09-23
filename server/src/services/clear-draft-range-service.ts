import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import type { ClearDraftRangeBody } from "../schemas/schedule-schema.js";

function toDatabaseDate(
  value: string,
): Date {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

export async function clearDraftRange(
  storeId: string,
  input: ClearDraftRangeBody,
) {
  return prisma.$transaction(
    async (transaction) => {
      const scheduleDays =
        await transaction.scheduleDay.findMany({
          where: {
            storeId,
            scheduleDate: {
              gte: toDatabaseDate(
                input.from,
              ),
              lte: toDatabaseDate(
                input.to,
              ),
            },
          },
          orderBy: {
            scheduleDate: "asc",
          },
          select: {
            id: true,
            scheduleDate: true,
            status: true,

            _count: {
              select: {
                shifts: true,
                coverageRequirements: true,
              },
            },
          },
        });

      const publishedScheduleDay =
        scheduleDays.find(
          (scheduleDay) =>
            scheduleDay.status ===
            "PUBLISHED",
        );

      if (publishedScheduleDay) {
        throw new AppError(
          409,
          "PUBLISHED_SCHEDULE_IN_RANGE",
          "A range containing a published schedule day cannot be cleared",
          {
            scheduleDate:
              publishedScheduleDay
                .scheduleDate
                .toISOString()
                .slice(0, 10),
          },
        );
      }

      const scheduleDayIds =
        scheduleDays.map(
          (scheduleDay) =>
            scheduleDay.id,
        );

      const startedShift =
        scheduleDayIds.length > 0
          ? await transaction.shift.findFirst({
              where: {
                scheduleDayId: {
                  in: scheduleDayIds,
                },
                startAt: {
                  lte: new Date(),
                },
              },
              select: {
                id: true,
                startAt: true,
              },
            })
          : null;

      if (startedShift) {
        throw new AppError(
          409,
          "DRAFT_RANGE_CONTAINS_STARTED_SHIFT",
          "A range containing a started shift cannot be cleared",
          {
            shiftId: startedShift.id,
            startAt:
              startedShift.startAt,
          },
        );
      }

      const preview = {
        range: {
          from: input.from,
          to: input.to,
        },
        scheduleDayCount:
          scheduleDays.length,
        shiftCount:
          scheduleDays.reduce(
            (total, scheduleDay) =>
              total +
              scheduleDay._count.shifts,
            0,
          ),
        coverageRequirementCount:
          scheduleDays.reduce(
            (total, scheduleDay) =>
              total +
              scheduleDay._count
                .coverageRequirements,
            0,
          ),
      };

      if (!input.confirmed) {
        return {
          cleared: false,
          preview,
        };
      }

      const deletionResult =
        scheduleDayIds.length > 0
          ? await transaction.scheduleDay.deleteMany(
              {
                where: {
                  id: {
                    in: scheduleDayIds,
                  },
                },
              },
            )
          : {
              count: 0,
            };

      return {
        cleared: true,
        preview,
        deletedScheduleDayCount:
          deletionResult.count,
        deletedShiftCount:
          preview.shiftCount,
        deletedCoverageRequirementCount:
          preview.coverageRequirementCount,
      };
    },
    {
      isolationLevel: "Serializable",
    },
  );
}