import { prisma } from "../lib/prisma.js";
import { expireStaleCoverageRequests } from "./coverage-request-service.js";

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