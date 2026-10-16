import { prisma } from "../lib/prisma.js";
import { expireStaleCoverageRequests } from "./coverage-request-service.js";
import { calculateUnderstaffedIntervals } from "../utils/coverage.js";
import { formatDateInTimeZone } from "../utils/schedule-time.js";

function addDaysToScheduleDate(
  scheduleDate: string,
  days: number,
): string {
  const date = new Date(
    `${scheduleDate}T00:00:00.000Z`,
  );

  date.setUTCDate(
    date.getUTCDate() + days,
  );

  return date.toISOString().slice(0, 10);
}

export async function getStaffDashboard(
  userId: string,
  storeId: string,
  membershipId: string,
) {
  await expireStaleCoverageRequests(
    storeId,
  );

  const now = new Date();

  const [
    nextShift,
    unreadNotificationCount,
    pendingDirectOfferCount,
    activeOwnRequestCount,
    openCoverageRequestCount,
  ] = await prisma.$transaction([
    prisma.shift.findFirst({
      where: {
        assigneeMembershipId:
          membershipId,
        status: "ACTIVE",
        endAt: {
          gt: now,
        },
        scheduleDay: {
          storeId,
          status: "PUBLISHED",
        },
      },
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

        shiftPreset: {
          select: {
            id: true,
            name: true,
          },
        },

        scheduleDay: {
          select: {
            id: true,
            scheduleDate: true,
            status: true,
          },
        },
      },
    }),

    prisma.notification.count({
      where: {
        recipientUserId: userId,
        readAt: null,
        OR: [
          {
            storeId,
          },
          {
            storeId: null,
          },
        ],
      },
    }),

    prisma.coverageCandidate.count({
      where: {
        membershipId,
        type: "DIRECT_OFFER",
        status: "PENDING",

        coverageRequest: {
          storeId,
          status: "OPEN",
          requestedStartAt: {
            gt: now,
          },
          responseDeadline: {
            gt: now,
          },
          shift: {
            status: "ACTIVE",
          },
        },
      },
    }),

    prisma.coverageRequest.count({
      where: {
        storeId,
        requesterMembershipId:
          membershipId,
        status: {
          in: [
            "PENDING_REVIEW",
            "OPEN",
          ],
        },
        requestedStartAt: {
          gt: now,
        },
      },
    }),

    prisma.coverageRequest.count({
      where: {
        storeId,
        status: "OPEN",
        originalAssigneeMembershipId: {
          not: membershipId,
        },
        requestedStartAt: {
          gt: now,
        },
        responseDeadline: {
          gt: now,
        },
        shift: {
          status: "ACTIVE",
        },
        candidates: {
          none: {
            membershipId,
          },
        },
      },
    }),
  ]);

  return {
    generatedAt: now,
    nextShift,
    alerts: {
      unreadNotificationCount,
      pendingDirectOfferCount,
      activeOwnRequestCount,
      openCoverageRequestCount,
    },
  };
}

export async function getManagerDashboard(
  userId: string,
  storeId: string,
) {
  await expireStaleCoverageRequests(
    storeId,
  );

  const now = new Date();

  const store =
    await prisma.store.findUniqueOrThrow({
      where: {
        id: storeId,
      },
      select: {
        timeZone: true,
      },
    });

  const today =
    formatDateInTimeZone(
      now,
      store.timeZone,
    );

  const upcomingThrough =
    addDaysToScheduleDate(today, 6);

  const todayDatabaseDate =
    new Date(
      `${today}T00:00:00.000Z`,
    );

  const upcomingThroughDatabaseDate =
    new Date(
      `${upcomingThrough}T00:00:00.000Z`,
    );

  const deadlineAttentionAt =
    new Date(
      now.getTime() +
        24 * 60 * 60 * 1000,
    );

  const [
    todayShifts,
    pendingReviewCount,
    openDeadlineAttentionCount,
    availableDirectOfferCount,
    upcomingScheduleDays,
    draftScheduleDayCount,
    unreadNotificationCount,
  ] = await prisma.$transaction([
    prisma.shift.findMany({
      where: {
        status: "ACTIVE",
        scheduleDay: {
          storeId,
          status: "PUBLISHED",
          scheduleDate:
            todayDatabaseDate,
        },
      },
      orderBy: {
        startAt: "asc",
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        breakMinutes: true,
        note: true,

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
    }),

    prisma.coverageRequest.count({
      where: {
        storeId,
        status: "PENDING_REVIEW",
        requestedStartAt: {
          gt: now,
        },
      },
    }),

    prisma.coverageRequest.count({
      where: {
        storeId,
        status: "OPEN",
        requestedStartAt: {
          gt: now,
        },
        responseDeadline: {
          lte: deadlineAttentionAt,
        },
      },
    }),

    prisma.coverageCandidate.count({
      where: {
        type: "DIRECT_OFFER",
        status: "AVAILABLE",

        coverageRequest: {
          storeId,
          status: "OPEN",
          requestedStartAt: {
            gt: now,
          },
        },
      },
    }),

    prisma.scheduleDay.findMany({
      where: {
        storeId,
        status: "PUBLISHED",
        scheduleDate: {
          gte: todayDatabaseDate,
          lte:
            upcomingThroughDatabaseDate,
        },
      },
      orderBy: {
        scheduleDate: "asc",
      },
      select: {
        id: true,
        scheduleDate: true,

        coverageRequirements: {
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
    }),

    prisma.scheduleDay.count({
      where: {
        storeId,
        status: "DRAFT",
        scheduleDate: {
          gte: todayDatabaseDate,
        },
      },
    }),

    prisma.notification.count({
      where: {
        recipientUserId: userId,
        readAt: null,
        OR: [
          {
            storeId,
          },
          {
            storeId: null,
          },
        ],
      },
    }),
  ]);

  const upcomingUnderstaffedIntervals =
    upcomingScheduleDays
      .flatMap((scheduleDay) =>
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
              endAt:
                requirement.endAt,
              requiredCount:
                requirement.requiredCount,
            }),
          ),
          scheduleDay.shifts,
        )
          .filter(
            (interval) =>
              interval.endAt.getTime() >
              now.getTime(),
          )
          .map((interval) => ({
            ...interval,
            scheduleDayId:
              scheduleDay.id,
            scheduleDate:
              scheduleDay.scheduleDate
                .toISOString()
                .slice(0, 10),
          })),
      )
      .sort(
        (first, second) =>
          first.startAt.getTime() -
          second.startAt.getTime(),
      );

  const assignedMembershipIds =
    new Set(
      todayShifts.map(
        (shift) => shift.assignee.id,
      ),
    );

  return {
    generatedAt: now,
    timeZone: store.timeZone,

    today: {
      scheduleDate: today,
      assignedMemberCount:
        assignedMembershipIds.size,
      shifts: todayShifts,
    },

    alerts: {
      pendingReviewCount,
      openDeadlineAttentionCount,
      availableDirectOfferCount,
      upcomingUnderstaffedCount:
        upcomingUnderstaffedIntervals.length,
      draftScheduleDayCount,
      unreadNotificationCount,
    },

    upcomingUnderstaffedIntervals:
      upcomingUnderstaffedIntervals.slice(
        0,
        20,
      ),
  };
}