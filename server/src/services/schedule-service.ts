import { calculateUnderstaffedIntervals } from "../utils/coverage.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import { ensureScheduleDayWithCoverageRequirements } from "./schedule-day-service.js";
import type {
  ListScheduleDaysQuery,
  PublishScheduleDaysBody,
} from "../schemas/schedule-schema.js";

function toDatabaseDate(
  value: string,
): Date {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

function getScheduleDateRange(
  from: string,
  to: string,
): string[] {
  const dates: string[] = [];

  const currentDate =
    toDatabaseDate(from);

  const endDate =
    toDatabaseDate(to);

  while (
    currentDate.getTime() <=
    endDate.getTime()
  ) {
    dates.push(
      currentDate
        .toISOString()
        .slice(0, 10),
    );

    currentDate.setUTCDate(
      currentDate.getUTCDate() + 1,
    );
  }

  return dates;
}

export async function listScheduleDays(
  storeId: string,
  query: ListScheduleDaysQuery,
  includeDrafts: boolean,
) {
  const scheduleDays =
    await prisma.scheduleDay.findMany({
      where: {
        storeId,

        scheduleDate: {
          gte: toDatabaseDate(query.from),
          lte: toDatabaseDate(query.to),
        },

        ...(includeDrafts
          ? {}
          : {
            status: "PUBLISHED",
          }),
      },

      orderBy: {
        scheduleDate: "asc",
      },

      select: {
        id: true,
        scheduleDate: true,
        status: true,
        publishedAt: true,
        publishedByMembershipId: true,
        createdAt: true,
        updatedAt: true,

        coverageRequirements: {
          orderBy: {
            startAt: "asc",
          },

          select: {
            id: true,
            startAt: true,
            endAt: true,
            requiredCount: true,

            shiftPreset: {
              select: {
                id: true,
                name: true,
                startMinute: true,
                endMinute: true,
                crossesMidnight: true,
                sortOrder: true,
              },
            },
          },
        },

        shifts: {
          orderBy: {
            startAt: "asc",
          },

          select: {
            id: true,
            startAt: true,
            endAt: true,
            breakMinutes: true,
            status: true,
            note: true,
            cancelledAt: true,
            createdAt: true,
            updatedAt: true,

            shiftPreset: {
              select: {
                id: true,
                name: true,
              },
            },

            assignee: {
              select: {
                id: true,
                loginId: true,
                role: true,
                colorKey: true,

                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  return scheduleDays.map((scheduleDay) => {
    const coverageWarnings =
      calculateUnderstaffedIntervals(
        scheduleDay.coverageRequirements.map(
          (requirement) => ({
            id: requirement.id,
            shiftPresetId:
              requirement.shiftPreset.id,
            shiftPresetName:
              requirement.shiftPreset.name,
            startAt: requirement.startAt,
            endAt: requirement.endAt,
            requiredCount:
              requirement.requiredCount,
          }),
        ),
        scheduleDay.shifts.map((shift) => ({
          assigneeMembershipId:
            shift.assignee.id,
          startAt: shift.startAt,
          endAt: shift.endAt,
          status: shift.status,
        })),
      );

    return {
      ...scheduleDay,

      scheduleDate:
        scheduleDay.scheduleDate
          .toISOString()
          .slice(0, 10),

      coverageWarnings,
    };
  });
}

export async function publishScheduleDays(
  storeId: string,
  managerMembershipId: string,
  input: PublishScheduleDaysBody,
) {
  const store = await prisma.store.findUnique({
    where: {
      id: storeId,
    },
    select: {
      timeZone: true,
    },
  });

  if (!store) {
    throw new AppError(
      404,
      "STORE_NOT_FOUND",
      "Store not found",
    );
  }

  const scheduleDates =
    getScheduleDateRange(
      input.from,
      input.to,
    );

  const publishedAt = new Date();

  return prisma.$transaction(
    async (transaction) => {
      const scheduleDayIds: string[] = [];

      for (const scheduleDate of scheduleDates) {
        const { scheduleDay } =
          await ensureScheduleDayWithCoverageRequirements(
            {
              transaction,
              storeId,
              scheduleDate,
              timeZone: store.timeZone,
            },
          );

        if (
          scheduleDay.status ===
          "PUBLISHED"
        ) {
          throw new AppError(
            409,
            "SCHEDULE_DAY_ALREADY_PUBLISHED",
            "One or more schedule days are already published",
            {
              scheduleDate,
            },
          );
        }

        scheduleDayIds.push(
          scheduleDay.id,
        );
      }

      await transaction.scheduleDay.updateMany({
        where: {
          id: {
            in: scheduleDayIds,
          },
        },
        data: {
          status: "PUBLISHED",
          publishedAt,
          publishedByMembershipId:
            managerMembershipId,
        },
      });

      const scheduleDays =
        await transaction.scheduleDay.findMany({
          where: {
            id: {
              in: scheduleDayIds,
            },
          },
          orderBy: {
            scheduleDate: "asc",
          },
          select: {
            id: true,
            scheduleDate: true,
            status: true,
            publishedAt: true,
            publishedByMembershipId: true,

            coverageRequirements: {
              orderBy: {
                startAt: "asc",
              },
              select: {
                id: true,
                shiftPresetId: true,
                startAt: true,
                endAt: true,
                requiredCount: true,
                shiftPreset: {
                  select: {
                    name: true,
                  },
                },
              },
            },

            shifts: {
              where: {
                status: "ACTIVE",
              },
              select: {
                assigneeMembershipId: true,
                startAt: true,
                endAt: true,
                status: true,
              },
            },
          },
        });

      const publishedDays =
        scheduleDays.map((scheduleDay) => {
          const coverageWarnings =
            calculateUnderstaffedIntervals(
              scheduleDay.coverageRequirements.map(
                (requirement) => ({
                  id: requirement.id,
                  shiftPresetId:
                    requirement.shiftPresetId,
                  shiftPresetName:
                    requirement.shiftPreset.name,
                  startAt:
                    requirement.startAt,
                  endAt: requirement.endAt,
                  requiredCount:
                    requirement.requiredCount,
                }),
              ),
              scheduleDay.shifts,
            );

          return {
            id: scheduleDay.id,
            scheduleDate:
              scheduleDay.scheduleDate
                .toISOString()
                .slice(0, 10),
            status: scheduleDay.status,
            publishedAt:
              scheduleDay.publishedAt,
            publishedByMembershipId:
              scheduleDay
                .publishedByMembershipId,
            shiftCount:
              scheduleDay.shifts.length,
            coverageWarnings,
          };
        });

      return {
        publishedDays,
        summary: {
          publishedDateCount:
            publishedDays.length,
          shiftCount:
            publishedDays.reduce(
              (total, scheduleDay) =>
                total +
                scheduleDay.shiftCount,
              0,
            ),
          coverageWarningCount:
            publishedDays.reduce(
              (total, scheduleDay) =>
                total +
                scheduleDay
                  .coverageWarnings.length,
              0,
            ),
        },
      };
    },
    {
      isolationLevel: "Serializable",
    },
  );
}