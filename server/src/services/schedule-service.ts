import { calculateUnderstaffedIntervals } from "../utils/coverage.js";
import { prisma } from "../lib/prisma.js";
import type { ListScheduleDaysQuery } from "../schemas/schedule-schema.js";

function toDatabaseDate(
  value: string,
): Date {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
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