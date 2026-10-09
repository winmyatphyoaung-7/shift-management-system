import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import type {
  ApproveCoverageRequestBody,
  CreateStaffCoverageRequestBody,
  ListManagerCoverageRequestsQuery,
  RejectCoverageRequestBody,
  CreateManagerCoverageRequestBody,
  SendDirectOffersBody,
  FinalApproveCoverageRequestBody,
} from "../schemas/coverage-request-schema.js";

const STAFF_REQUEST_NOTICE_DAYS = 7;

const STAFF_REQUEST_NOTICE_MS =
  STAFF_REQUEST_NOTICE_DAYS *
  24 *
  60 *
  60 *
  1000;

function isUniqueConstraintError(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function isTransactionConflictError(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export async function createStaffCoverageRequest(
  storeId: string,
  requesterMembershipId: string,
  input: CreateStaffCoverageRequestBody,
) {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const shift =
          await transaction.shift.findFirst({
            where: {
              id: input.shiftId,

              scheduleDay: {
                storeId,
              },
            },

            select: {
              id: true,
              assigneeMembershipId: true,
              startAt: true,
              endAt: true,
              status: true,

              scheduleDay: {
                select: {
                  status: true,
                },
              },
            },
          });

        if (!shift) {
          throw new AppError(
            404,
            "SHIFT_NOT_FOUND",
            "Shift not found",
          );
        }

        if (
          shift.assigneeMembershipId !==
          requesterMembershipId
        ) {
          throw new AppError(
            403,
            "SHIFT_NOT_ASSIGNED_TO_MEMBER",
            "A staff member can request replacement only for their own shift",
          );
        }

        if (shift.status !== "ACTIVE") {
          throw new AppError(
            409,
            "SHIFT_NOT_ACTIVE",
            "A replacement request can be created only for an active shift",
          );
        }

        if (
          shift.scheduleDay.status !==
          "PUBLISHED"
        ) {
          throw new AppError(
            409,
            "SHIFT_NOT_PUBLISHED",
            "A replacement request can be created only for a published shift",
          );
        }

        const now = new Date();

        if (
          shift.startAt.getTime() <=
          now.getTime()
        ) {
          throw new AppError(
            409,
            "SHIFT_ALREADY_STARTED",
            "A replacement request cannot be created after the shift start time",
          );
        }

        const minimumAllowedStartAt =
          new Date(
            now.getTime() +
            STAFF_REQUEST_NOTICE_MS,
          );

        if (
          shift.startAt.getTime() <
          minimumAllowedStartAt.getTime()
        ) {
          throw new AppError(
            409,
            "STAFF_REQUEST_NOTICE_TOO_SHORT",
            "Staff replacement requests require at least seven full days of notice",
            {
              minimumNoticeDays:
                STAFF_REQUEST_NOTICE_DAYS,
              shiftStartAt: shift.startAt,
            },
          );
        }

        const activeRequest =
          await transaction
            .coverageRequest
            .findFirst({
              where: {
                shiftId: shift.id,

                status: {
                  in: [
                    "PENDING_REVIEW",
                    "OPEN",
                  ],
                },
              },

              select: {
                id: true,
              },
            });

        if (activeRequest) {
          throw new AppError(
            409,
            "COVERAGE_REQUEST_ALREADY_ACTIVE",
            "This shift already has an active replacement request",
          );
        }

        return transaction
          .coverageRequest
          .create({
            data: {
              storeId,
              shiftId: shift.id,
              originalAssigneeMembershipId:
                shift.assigneeMembershipId,
              requesterMembershipId,
              createdByMembershipId:
                requesterMembershipId,
              source: "STAFF",
              reasonCategory:
                input.reasonCategory,
              reasonDetails:
                input.reasonDetails || null,
              requestedStartAt:
                shift.startAt,
              requestedEndAt:
                shift.endAt,
              status: "PENDING_REVIEW",
            },

            select: {
              id: true,
              shiftId: true,
              originalAssigneeMembershipId:
                true,
              requesterMembershipId: true,
              source: true,
              reasonCategory: true,
              reasonDetails: true,
              requestedStartAt: true,
              requestedEndAt: true,
              status: true,
              responseDeadline: true,
              createdAt: true,
              updatedAt: true,
            },
          });
      },
      {
        isolationLevel: "Serializable",
      },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        409,
        "COVERAGE_REQUEST_ALREADY_ACTIVE",
        "This shift already has an active replacement request",
      );
    }

    throw error;
  }
}

export async function listManagerCoverageRequests(
  storeId: string,
  query: ListManagerCoverageRequestsQuery,
) {
  return prisma.coverageRequest.findMany({
    where: {
      storeId,

      ...(query.status
        ? {
          status: query.status,
        }
        : {}),
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      shiftId: true,
      source: true,
      reasonCategory: true,
      reasonDetails: true,
      requestedStartAt: true,
      requestedEndAt: true,
      status: true,
      responseDeadline: true,
      rejectionNote: true,
      approvedAt: true,
      selectedCandidateId: true,
      createdAt: true,
      updatedAt: true,

      shift: {
        select: {
          id: true,
          status: true,
          startAt: true,
          endAt: true,
          note: true,

          scheduleDay: {
            select: {
              scheduleDate: true,
              status: true,
            },
          },
        },
      },

      originalAssignee: {
        select: {
          id: true,
          loginId: true,
          role: true,
          status: true,
          colorKey: true,

          user: {
            select: {
              name: true,
            },
          },
        },
      },

      requester: {
        select: {
          id: true,
          loginId: true,
          role: true,
          status: true,
          colorKey: true,

          user: {
            select: {
              name: true,
            },
          },
        },
      },

      candidates: {
        orderBy: {
          createdAt: "asc",
        },

        select: {
          id: true,
          type: true,
          status: true,
          respondedAt: true,
          createdAt: true,
          updatedAt: true,

          membership: {
            select: {
              id: true,
              loginId: true,
              role: true,
              status: true,
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

      _count: {
        select: {
          candidates: true,
        },
      },
    },
  });
}

export async function approveAndOpenCoverageRequest(
  storeId: string,
  coverageRequestId: string,
  input: ApproveCoverageRequestBody,
) {
  return prisma.$transaction(
    async (transaction) => {
      const coverageRequest =
        await transaction
          .coverageRequest
          .findFirst({
            where: {
              id: coverageRequestId,
              storeId,
            },

            select: {
              id: true,
              status: true,

              shift: {
                select: {
                  id: true,
                  status: true,
                  startAt: true,
                },
              },
            },
          });

      if (!coverageRequest) {
        throw new AppError(
          404,
          "COVERAGE_REQUEST_NOT_FOUND",
          "Coverage request not found",
        );
      }

      if (
        coverageRequest.status !==
        "PENDING_REVIEW"
      ) {
        throw new AppError(
          409,
          "COVERAGE_REQUEST_NOT_PENDING",
          "Only a pending coverage request can be approved and opened",
        );
      }

      if (
        coverageRequest.shift.status !==
        "ACTIVE"
      ) {
        throw new AppError(
          409,
          "SHIFT_NOT_ACTIVE",
          "The related shift is not active",
        );
      }

      const now = new Date();

      if (
        coverageRequest.shift.startAt
          .getTime() <= now.getTime()
      ) {
        throw new AppError(
          409,
          "SHIFT_ALREADY_STARTED",
          "A coverage request cannot be opened after the shift start time",
        );
      }

      const responseDeadline =
        new Date(input.responseDeadline);

      if (
        responseDeadline.getTime() <=
        now.getTime()
      ) {
        throw new AppError(
          400,
          "RESPONSE_DEADLINE_NOT_FUTURE",
          "Response deadline must be in the future",
        );
      }

      if (
        responseDeadline.getTime() >=
        coverageRequest.shift.startAt
          .getTime()
      ) {
        throw new AppError(
          400,
          "RESPONSE_DEADLINE_TOO_LATE",
          "Response deadline must be before the shift start time",
        );
      }

      const updateResult =
        await transaction
          .coverageRequest
          .updateMany({
            where: {
              id: coverageRequest.id,
              storeId,
              status: "PENDING_REVIEW",
            },

            data: {
              status: "OPEN",
              responseDeadline,
              rejectionNote: null,
            },
          });

      if (updateResult.count !== 1) {
        throw new AppError(
          409,
          "COVERAGE_REQUEST_STATE_CHANGED",
          "Coverage request state changed before it could be opened",
        );
      }

      return transaction
        .coverageRequest
        .findUniqueOrThrow({
          where: {
            id: coverageRequest.id,
          },

          select: {
            id: true,
            shiftId: true,
            source: true,
            reasonCategory: true,
            reasonDetails: true,
            requestedStartAt: true,
            requestedEndAt: true,
            status: true,
            responseDeadline: true,
            rejectionNote: true,
            createdAt: true,
            updatedAt: true,
          },
        });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function rejectCoverageRequest(
  storeId: string,
  coverageRequestId: string,
  input: RejectCoverageRequestBody,
) {
  return prisma.$transaction(
    async (transaction) => {
      const coverageRequest =
        await transaction
          .coverageRequest
          .findFirst({
            where: {
              id: coverageRequestId,
              storeId,
            },

            select: {
              id: true,
              status: true,

              shift: {
                select: {
                  status: true,
                  startAt: true,
                },
              },
            },
          });

      if (!coverageRequest) {
        throw new AppError(
          404,
          "COVERAGE_REQUEST_NOT_FOUND",
          "Coverage request not found",
        );
      }

      if (
        coverageRequest.status !==
        "PENDING_REVIEW"
      ) {
        throw new AppError(
          409,
          "COVERAGE_REQUEST_NOT_PENDING",
          "Only a pending coverage request can be rejected",
        );
      }

      if (
        coverageRequest.shift.status !==
        "ACTIVE"
      ) {
        throw new AppError(
          409,
          "SHIFT_NOT_ACTIVE",
          "The related shift is not active",
        );
      }

      if (
        coverageRequest.shift.startAt
          .getTime() <= Date.now()
      ) {
        throw new AppError(
          409,
          "SHIFT_ALREADY_STARTED",
          "A coverage request cannot be rejected after the shift start time",
        );
      }

      const updateResult =
        await transaction
          .coverageRequest
          .updateMany({
            where: {
              id: coverageRequest.id,
              storeId,
              status: "PENDING_REVIEW",
            },

            data: {
              status: "REJECTED",
              rejectionNote:
                input.rejectionNote || null,
              responseDeadline: null,
            },
          });

      if (updateResult.count !== 1) {
        throw new AppError(
          409,
          "COVERAGE_REQUEST_STATE_CHANGED",
          "Coverage request state changed before it could be rejected",
        );
      }

      return transaction
        .coverageRequest
        .findUniqueOrThrow({
          where: {
            id: coverageRequest.id,
          },

          select: {
            id: true,
            shiftId: true,
            source: true,
            reasonCategory: true,
            reasonDetails: true,
            requestedStartAt: true,
            requestedEndAt: true,
            status: true,
            responseDeadline: true,
            rejectionNote: true,
            createdAt: true,
            updatedAt: true,
          },
        });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function createManagerCoverageRequest(
  storeId: string,
  managerMembershipId: string,
  input: CreateManagerCoverageRequestBody,
) {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const shift =
          await transaction.shift.findFirst({
            where: {
              id: input.shiftId,

              scheduleDay: {
                storeId,
              },
            },

            select: {
              id: true,
              assigneeMembershipId: true,
              startAt: true,
              endAt: true,
              status: true,

              scheduleDay: {
                select: {
                  status: true,
                },
              },
            },
          });

        if (!shift) {
          throw new AppError(
            404,
            "SHIFT_NOT_FOUND",
            "Shift not found",
          );
        }

        if (shift.status !== "ACTIVE") {
          throw new AppError(
            409,
            "SHIFT_NOT_ACTIVE",
            "A replacement request can be created only for an active shift",
          );
        }

        if (
          shift.scheduleDay.status !==
          "PUBLISHED"
        ) {
          throw new AppError(
            409,
            "SHIFT_NOT_PUBLISHED",
            "A replacement request can be created only for a published shift",
          );
        }

        const now = new Date();

        if (
          shift.startAt.getTime() <=
          now.getTime()
        ) {
          throw new AppError(
            409,
            "SHIFT_ALREADY_STARTED",
            "A replacement request cannot be created after the shift start time",
          );
        }

        const responseDeadline =
          new Date(input.responseDeadline);

        if (
          responseDeadline.getTime() <=
          now.getTime()
        ) {
          throw new AppError(
            400,
            "RESPONSE_DEADLINE_NOT_FUTURE",
            "Response deadline must be in the future",
          );
        }

        if (
          responseDeadline.getTime() >=
          shift.startAt.getTime()
        ) {
          throw new AppError(
            400,
            "RESPONSE_DEADLINE_TOO_LATE",
            "Response deadline must be before the shift start time",
          );
        }

        const activeRequest =
          await transaction
            .coverageRequest
            .findFirst({
              where: {
                shiftId: shift.id,

                status: {
                  in: [
                    "PENDING_REVIEW",
                    "OPEN",
                  ],
                },
              },

              select: {
                id: true,
              },
            });

        if (activeRequest) {
          throw new AppError(
            409,
            "COVERAGE_REQUEST_ALREADY_ACTIVE",
            "This shift already has an active replacement request",
          );
        }

        return transaction
          .coverageRequest
          .create({
            data: {
              storeId,
              shiftId: shift.id,
              originalAssigneeMembershipId:
                shift.assigneeMembershipId,
              requesterMembershipId:
                managerMembershipId,
              createdByMembershipId:
                managerMembershipId,
              source: "MANAGER",
              reasonCategory:
                input.reasonCategory,
              reasonDetails:
                input.reasonDetails || null,
              requestedStartAt:
                shift.startAt,
              requestedEndAt:
                shift.endAt,
              status: "OPEN",
              responseDeadline,
            },

            select: {
              id: true,
              shiftId: true,
              originalAssigneeMembershipId:
                true,
              requesterMembershipId: true,
              source: true,
              reasonCategory: true,
              reasonDetails: true,
              requestedStartAt: true,
              requestedEndAt: true,
              status: true,
              responseDeadline: true,
              createdAt: true,
              updatedAt: true,
            },
          });
      },
      {
        isolationLevel: "Serializable",
      },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        409,
        "COVERAGE_REQUEST_ALREADY_ACTIVE",
        "This shift already has an active replacement request",
      );
    }

    throw error;
  }
}

export async function listPublicCoverageRequests(
  storeId: string,
  membershipId: string,
) {
  const now = new Date();

  return prisma.coverageRequest.findMany({
    where: {
      storeId,
      status: "OPEN",

      responseDeadline: {
        gt: now,
      },

      requestedStartAt: {
        gt: now,
      },

      originalAssigneeMembershipId: {
        not: membershipId,
      },
    },

    orderBy: {
      requestedStartAt: "asc",
    },

    select: {
      id: true,
      shiftId: true,
      requestedStartAt: true,
      requestedEndAt: true,
      status: true,
      responseDeadline: true,
      createdAt: true,

      shift: {
        select: {
          status: true,

          scheduleDay: {
            select: {
              scheduleDate: true,
              status: true,
            },
          },
        },
      },

      originalAssignee: {
        select: {
          id: true,
          colorKey: true,

          user: {
            select: {
              name: true,
            },
          },
        },
      },

      candidates: {
        where: {
          membershipId,
        },

        select: {
          id: true,
          type: true,
          status: true,
          respondedAt: true,
        },
      },
    },
  });
}

export async function volunteerForCoverageRequest(
  storeId: string,
  membershipId: string,
  coverageRequestId: string,
) {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const coverageRequest =
          await transaction
            .coverageRequest
            .findFirst({
              where: {
                id: coverageRequestId,
                storeId,
              },

              select: {
                id: true,
                status: true,
                originalAssigneeMembershipId:
                  true,
                requestedStartAt: true,
                requestedEndAt: true,
                responseDeadline: true,

                shift: {
                  select: {
                    status: true,
                    startAt: true,
                  },
                },
              },
            });

        if (!coverageRequest) {
          throw new AppError(
            404,
            "COVERAGE_REQUEST_NOT_FOUND",
            "Coverage request not found",
          );
        }

        if (
          coverageRequest.status !==
          "OPEN"
        ) {
          throw new AppError(
            409,
            "COVERAGE_REQUEST_NOT_OPEN",
            "Only an open coverage request accepts volunteers",
          );
        }

        if (
          coverageRequest.shift.status !==
          "ACTIVE"
        ) {
          throw new AppError(
            409,
            "SHIFT_NOT_ACTIVE",
            "The related shift is not active",
          );
        }

        const now = new Date();

        if (
          coverageRequest.shift.startAt
            .getTime() <= now.getTime()
        ) {
          throw new AppError(
            409,
            "SHIFT_ALREADY_STARTED",
            "Volunteering is not allowed after the shift start time",
          );
        }

        if (
          !coverageRequest.responseDeadline ||
          coverageRequest.responseDeadline
            .getTime() <= now.getTime()
        ) {
          throw new AppError(
            409,
            "RESPONSE_DEADLINE_PASSED",
            "The response deadline has passed",
          );
        }

        if (
          coverageRequest
            .originalAssigneeMembershipId ===
          membershipId
        ) {
          throw new AppError(
            409,
            "CANNOT_VOLUNTEER_FOR_OWN_SHIFT",
            "A member cannot volunteer for their own assigned shift",
          );
        }

        const existingCandidate =
          await transaction
            .coverageCandidate
            .findUnique({
              where: {
                coverageRequestId_membershipId:
                {
                  coverageRequestId:
                    coverageRequest.id,
                  membershipId,
                },
              },

              select: {
                id: true,
                status: true,
              },
            });

        if (existingCandidate) {
          throw new AppError(
            409,
            "COVERAGE_RESPONSE_ALREADY_EXISTS",
            "This member already has a response for the coverage request",
          );
        }

        const overlappingShift =
          await transaction.shift.findFirst({
            where: {
              assigneeMembershipId:
                membershipId,
              status: "ACTIVE",

              scheduleDay: {
                storeId,
              },

              startAt: {
                lt: coverageRequest
                  .requestedEndAt,
              },

              endAt: {
                gt: coverageRequest
                  .requestedStartAt,
              },
            },

            select: {
              id: true,
              startAt: true,
              endAt: true,
            },
          });

        if (overlappingShift) {
          throw new AppError(
            409,
            "VOLUNTEER_HAS_OVERLAPPING_SHIFT",
            "A member with an overlapping shift cannot volunteer",
            {
              shiftId:
                overlappingShift.id,
              startAt:
                overlappingShift.startAt,
              endAt:
                overlappingShift.endAt,
            },
          );
        }

        return transaction
          .coverageCandidate
          .create({
            data: {
              coverageRequestId:
                coverageRequest.id,
              membershipId,
              type: "VOLUNTEER",
              status: "AVAILABLE",
              respondedAt: now,
            },

            select: {
              id: true,
              coverageRequestId: true,
              membershipId: true,
              type: true,
              status: true,
              respondedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          });
      },
      {
        isolationLevel: "Serializable",
      },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        409,
        "COVERAGE_RESPONSE_ALREADY_EXISTS",
        "This member already has a response for the coverage request",
      );
    }

    throw error;
  }
}

export async function withdrawCoverageResponse(
  storeId: string,
  membershipId: string,
  coverageRequestId: string,
) {
  return prisma.$transaction(
    async (transaction) => {
      const coverageRequest =
        await transaction.coverageRequest.findFirst({
          where: {
            id: coverageRequestId,
            storeId,
          },
          select: {
            id: true,
            status: true,
            shift: {
              select: {
                startAt: true,
              },
            },
          },
        });

      if (!coverageRequest) {
        throw new AppError(
          404,
          "COVERAGE_REQUEST_NOT_FOUND",
          "Coverage request not found",
        );
      }

      if (coverageRequest.status !== "OPEN") {
        throw new AppError(
          409,
          "COVERAGE_REQUEST_NOT_OPEN",
          "Only an open coverage request allows withdrawal",
        );
      }

      if (
        coverageRequest.shift.startAt.getTime() <=
        Date.now()
      ) {
        throw new AppError(
          409,
          "SHIFT_ALREADY_STARTED",
          "A coverage response cannot be withdrawn after the shift start time",
        );
      }

      const candidate =
        await transaction.coverageCandidate.findUnique({
          where: {
            coverageRequestId_membershipId: {
              coverageRequestId:
                coverageRequest.id,
              membershipId,
            },
          },
          select: {
            id: true,
            type: true,
            status: true,
          },
        });

      if (!candidate) {
        throw new AppError(
          404,
          "COVERAGE_RESPONSE_NOT_FOUND",
          "Coverage response not found",
        );
      }

      if (candidate.status !== "AVAILABLE") {
        throw new AppError(
          409,
          "COVERAGE_RESPONSE_NOT_WITHDRAWABLE",
          "Only an available response can be withdrawn",
        );
      }

      const updateResult =
        await transaction.coverageCandidate.updateMany({
          where: {
            id: candidate.id,
            status: "AVAILABLE",
          },
          data: {
            status: "WITHDRAWN",
          },
        });

      if (updateResult.count !== 1) {
        throw new AppError(
          409,
          "COVERAGE_RESPONSE_STATE_CHANGED",
          "The coverage response state has changed",
        );
      }

      return transaction.coverageCandidate.findUniqueOrThrow({
        where: {
          id: candidate.id,
        },
        select: {
          id: true,
          coverageRequestId: true,
          membershipId: true,
          type: true,
          status: true,
          respondedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function sendDirectOffers(
  storeId: string,
  coverageRequestId: string,
  input: SendDirectOffersBody,
) {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const coverageRequest =
          await transaction.coverageRequest.findFirst({
            where: {
              id: coverageRequestId,
              storeId,
            },
            select: {
              id: true,
              status: true,
              originalAssigneeMembershipId: true,
              requestedStartAt: true,
              requestedEndAt: true,
              responseDeadline: true,
              shift: {
                select: {
                  status: true,
                  startAt: true,
                },
              },
            },
          });

        if (!coverageRequest) {
          throw new AppError(
            404,
            "COVERAGE_REQUEST_NOT_FOUND",
            "Coverage request not found",
          );
        }

        if (coverageRequest.status !== "OPEN") {
          throw new AppError(
            409,
            "COVERAGE_REQUEST_NOT_OPEN",
            "Direct offers can be sent only for an open coverage request",
          );
        }

        if (coverageRequest.shift.status !== "ACTIVE") {
          throw new AppError(
            409,
            "SHIFT_NOT_ACTIVE",
            "The related shift is not active",
          );
        }

        const now = new Date();

        if (
          coverageRequest.shift.startAt.getTime() <=
          now.getTime()
        ) {
          throw new AppError(
            409,
            "SHIFT_ALREADY_STARTED",
            "Direct offers cannot be sent after the shift start time",
          );
        }

        if (
          !coverageRequest.responseDeadline ||
          coverageRequest.responseDeadline.getTime() <=
          now.getTime()
        ) {
          throw new AppError(
            409,
            "RESPONSE_DEADLINE_PASSED",
            "The response deadline has passed",
          );
        }

        if (
          input.membershipIds.includes(
            coverageRequest.originalAssigneeMembershipId,
          )
        ) {
          throw new AppError(
            409,
            "CANNOT_OFFER_ORIGINAL_ASSIGNEE",
            "A direct offer cannot be sent to the original assignee",
          );
        }

        const eligibleMembers =
          await transaction.storeMember.findMany({
            where: {
              storeId,
              id: {
                in: input.membershipIds,
              },
              role: "STAFF",
              status: "ACTIVE",
            },
            select: {
              id: true,
            },
          });

        if (
          eligibleMembers.length !==
          input.membershipIds.length
        ) {
          const eligibleMemberIds =
            new Set(
              eligibleMembers.map(
                (member) => member.id,
              ),
            );

          throw new AppError(
            409,
            "DIRECT_OFFER_MEMBER_NOT_ELIGIBLE",
            "One or more direct-offer members are not eligible",
            {
              membershipIds:
                input.membershipIds.filter(
                  (membershipId) =>
                    !eligibleMemberIds.has(
                      membershipId,
                    ),
                ),
            },
          );
        }

        const existingCandidates =
          await transaction.coverageCandidate.findMany({
            where: {
              coverageRequestId:
                coverageRequest.id,
              membershipId: {
                in: input.membershipIds,
              },
            },
            select: {
              membershipId: true,
              status: true,
            },
          });

        if (existingCandidates.length > 0) {
          throw new AppError(
            409,
            "COVERAGE_RESPONSE_ALREADY_EXISTS",
            "One or more members already have a response for this coverage request",
            {
              candidates:
                existingCandidates,
            },
          );
        }

        const overlappingShifts =
          await transaction.shift.findMany({
            where: {
              assigneeMembershipId: {
                in: input.membershipIds,
              },
              status: "ACTIVE",
              scheduleDay: {
                storeId,
              },
              startAt: {
                lt: coverageRequest.requestedEndAt,
              },
              endAt: {
                gt: coverageRequest.requestedStartAt,
              },
            },
            select: {
              id: true,
              assigneeMembershipId: true,
              startAt: true,
              endAt: true,
            },
          });

        if (overlappingShifts.length > 0) {
          throw new AppError(
            409,
            "DIRECT_OFFER_MEMBER_HAS_OVERLAPPING_SHIFT",
            "A direct offer cannot be sent to a member with an overlapping shift",
            {
              shifts: overlappingShifts,
            },
          );
        }

        for (const membershipId of input.membershipIds) {
          await transaction.coverageCandidate.create({
            data: {
              coverageRequestId:
                coverageRequest.id,
              membershipId,
              type: "DIRECT_OFFER",
              status: "PENDING",
            },
          });
        }

        return transaction.coverageCandidate.findMany({
          where: {
            coverageRequestId:
              coverageRequest.id,
            membershipId: {
              in: input.membershipIds,
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            coverageRequestId: true,
            membershipId: true,
            type: true,
            status: true,
            respondedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        409,
        "COVERAGE_RESPONSE_ALREADY_EXISTS",
        "One or more members already have a response for this coverage request",
      );
    }

    throw error;
  }
}

type DirectOfferResponse =
  | "ACCEPT"
  | "DECLINE";

async function respondToDirectOffer(
  storeId: string,
  membershipId: string,
  coverageRequestId: string,
  response: DirectOfferResponse,
) {
  return prisma.$transaction(
    async (transaction) => {
      const coverageRequest =
        await transaction.coverageRequest.findFirst({
          where: {
            id: coverageRequestId,
            storeId,
          },
          select: {
            id: true,
            status: true,
            requestedStartAt: true,
            requestedEndAt: true,
            responseDeadline: true,
            shift: {
              select: {
                status: true,
                startAt: true,
              },
            },
          },
        });

      if (!coverageRequest) {
        throw new AppError(
          404,
          "COVERAGE_REQUEST_NOT_FOUND",
          "Coverage request not found",
        );
      }

      if (coverageRequest.status !== "OPEN") {
        throw new AppError(
          409,
          "COVERAGE_REQUEST_NOT_OPEN",
          "The coverage request is not open",
        );
      }

      if (coverageRequest.shift.status !== "ACTIVE") {
        throw new AppError(
          409,
          "SHIFT_NOT_ACTIVE",
          "The related shift is not active",
        );
      }

      const now = new Date();

      if (
        coverageRequest.shift.startAt.getTime() <=
        now.getTime()
      ) {
        throw new AppError(
          409,
          "SHIFT_ALREADY_STARTED",
          "A direct offer cannot be answered after the shift start time",
        );
      }

      const candidate =
        await transaction.coverageCandidate.findUnique({
          where: {
            coverageRequestId_membershipId: {
              coverageRequestId:
                coverageRequest.id,
              membershipId,
            },
          },
          select: {
            id: true,
            type: true,
            status: true,
          },
        });

      if (
        !candidate ||
        candidate.type !== "DIRECT_OFFER"
      ) {
        throw new AppError(
          404,
          "DIRECT_OFFER_NOT_FOUND",
          "Direct offer not found",
        );
      }

      if (candidate.status !== "PENDING") {
        throw new AppError(
          409,
          "DIRECT_OFFER_ALREADY_RESPONDED",
          "This direct offer has already been answered",
        );
      }

      if (response === "ACCEPT") {
        if (
          !coverageRequest.responseDeadline ||
          coverageRequest.responseDeadline.getTime() <=
          now.getTime()
        ) {
          throw new AppError(
            409,
            "RESPONSE_DEADLINE_PASSED",
            "The response deadline has passed",
          );
        }

        const overlappingShift =
          await transaction.shift.findFirst({
            where: {
              assigneeMembershipId:
                membershipId,
              status: "ACTIVE",
              scheduleDay: {
                storeId,
              },
              startAt: {
                lt: coverageRequest.requestedEndAt,
              },
              endAt: {
                gt: coverageRequest.requestedStartAt,
              },
            },
            select: {
              id: true,
              startAt: true,
              endAt: true,
            },
          });

        if (overlappingShift) {
          throw new AppError(
            409,
            "DIRECT_OFFER_HAS_OVERLAPPING_SHIFT",
            "A member with an overlapping shift cannot accept the direct offer",
            {
              shiftId:
                overlappingShift.id,
              startAt:
                overlappingShift.startAt,
              endAt:
                overlappingShift.endAt,
            },
          );
        }
      }

      const nextStatus =
        response === "ACCEPT"
          ? "AVAILABLE"
          : "DECLINED";

      const updateResult =
        await transaction.coverageCandidate.updateMany({
          where: {
            id: candidate.id,
            type: "DIRECT_OFFER",
            status: "PENDING",
          },
          data: {
            status: nextStatus,
            respondedAt: now,
          },
        });

      if (updateResult.count !== 1) {
        throw new AppError(
          409,
          "DIRECT_OFFER_STATE_CHANGED",
          "The direct offer state has changed",
        );
      }

      return transaction.coverageCandidate.findUniqueOrThrow({
        where: {
          id: candidate.id,
        },
        select: {
          id: true,
          coverageRequestId: true,
          membershipId: true,
          type: true,
          status: true,
          respondedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export function acceptDirectOffer(
  storeId: string,
  membershipId: string,
  coverageRequestId: string,
) {
  return respondToDirectOffer(
    storeId,
    membershipId,
    coverageRequestId,
    "ACCEPT",
  );
}

export function declineDirectOffer(
  storeId: string,
  membershipId: string,
  coverageRequestId: string,
) {
  return respondToDirectOffer(
    storeId,
    membershipId,
    coverageRequestId,
    "DECLINE",
  );
}

export async function finalApproveCoverageRequest(
  storeId: string,
  managerMembershipId: string,
  coverageRequestId: string,
  input: FinalApproveCoverageRequestBody,
) {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const coverageRequest =
          await transaction.coverageRequest.findFirst({
            where: {
              id: coverageRequestId,
              storeId,
            },
            select: {
              id: true,
              status: true,
              originalAssigneeMembershipId: true,
              requestedStartAt: true,
              requestedEndAt: true,

              shift: {
                select: {
                  id: true,
                  assigneeMembershipId: true,
                  status: true,
                  startAt: true,
                },
              },
            },
          });

        if (!coverageRequest) {
          throw new AppError(
            404,
            "COVERAGE_REQUEST_NOT_FOUND",
            "Coverage request not found",
          );
        }

        if (coverageRequest.status !== "OPEN") {
          throw new AppError(
            409,
            "COVERAGE_REQUEST_NOT_OPEN",
            "Only an open coverage request can receive final approval",
          );
        }

        if (coverageRequest.shift.status !== "ACTIVE") {
          throw new AppError(
            409,
            "SHIFT_NOT_ACTIVE",
            "The related shift is not active",
          );
        }

        const now = new Date();

        if (
          coverageRequest.shift.startAt.getTime() <=
          now.getTime()
        ) {
          throw new AppError(
            409,
            "SHIFT_ALREADY_STARTED",
            "Final approval is not allowed after the shift start time",
          );
        }

        const candidate =
          await transaction.coverageCandidate.findFirst({
            where: {
              id: input.selectedCandidateId,
              coverageRequestId:
                coverageRequest.id,
            },
            select: {
              id: true,
              membershipId: true,
              type: true,
              status: true,

              membership: {
                select: {
                  storeId: true,
                  role: true,
                  status: true,
                },
              },
            },
          });

        if (!candidate) {
          throw new AppError(
            404,
            "COVERAGE_CANDIDATE_NOT_FOUND",
            "Coverage candidate not found",
          );
        }

        if (candidate.status !== "AVAILABLE") {
          throw new AppError(
            409,
            "COVERAGE_CANDIDATE_NOT_AVAILABLE",
            "Only an available candidate can be selected",
          );
        }

        if (
          candidate.membership.storeId !== storeId ||
          candidate.membership.role !== "STAFF" ||
          candidate.membership.status !== "ACTIVE"
        ) {
          throw new AppError(
            409,
            "COVERAGE_CANDIDATE_NOT_ELIGIBLE",
            "The selected candidate is not eligible",
          );
        }

        if (
          candidate.membershipId ===
          coverageRequest.originalAssigneeMembershipId
        ) {
          throw new AppError(
            409,
            "CANNOT_SELECT_ORIGINAL_ASSIGNEE",
            "The original assignee cannot be selected as the replacement",
          );
        }

        const overlappingShift =
          await transaction.shift.findFirst({
            where: {
              assigneeMembershipId:
                candidate.membershipId,
              status: "ACTIVE",
              scheduleDay: {
                storeId,
              },
              startAt: {
                lt: coverageRequest.requestedEndAt,
              },
              endAt: {
                gt: coverageRequest.requestedStartAt,
              },
            },
            select: {
              id: true,
              startAt: true,
              endAt: true,
            },
          });

        if (overlappingShift) {
          throw new AppError(
            409,
            "COVERAGE_CANDIDATE_HAS_OVERLAPPING_SHIFT",
            "The selected candidate has an overlapping shift",
            {
              shiftId: overlappingShift.id,
              startAt: overlappingShift.startAt,
              endAt: overlappingShift.endAt,
            },
          );
        }

        const requestUpdate =
          await transaction.coverageRequest.updateMany({
            where: {
              id: coverageRequest.id,
              status: "OPEN",
            },
            data: {
              status: "APPROVED",
              selectedCandidateId:
                candidate.id,
              approvedByMembershipId:
                managerMembershipId,
              approvedAt: now,
            },
          });

        if (requestUpdate.count !== 1) {
          throw new AppError(
            409,
            "COVERAGE_REQUEST_STATE_CHANGED",
            "The coverage request state has changed",
          );
        }

        const candidateUpdate =
          await transaction.coverageCandidate.updateMany({
            where: {
              id: candidate.id,
              status: "AVAILABLE",
            },
            data: {
              status: "SELECTED",
            },
          });

        if (candidateUpdate.count !== 1) {
          throw new AppError(
            409,
            "COVERAGE_CANDIDATE_STATE_CHANGED",
            "The selected candidate state has changed",
          );
        }

        const shiftUpdate =
          await transaction.shift.updateMany({
            where: {
              id: coverageRequest.shift.id,
              status: "ACTIVE",
              assigneeMembershipId:
                coverageRequest
                  .originalAssigneeMembershipId,
            },
            data: {
              assigneeMembershipId:
                candidate.membershipId,
              updatedByMembershipId:
                managerMembershipId,
            },
          });

        if (shiftUpdate.count !== 1) {
          throw new AppError(
            409,
            "SHIFT_ASSIGNMENT_STATE_CHANGED",
            "The shift assignment state has changed",
          );
        }

        await transaction.coverageCandidate.updateMany({
          where: {
            coverageRequestId:
              coverageRequest.id,
            id: {
              not: candidate.id,
            },
            status: {
              in: [
                "PENDING",
                "AVAILABLE",
              ],
            },
          },
          data: {
            status: "NOT_SELECTED",
          },
        });

        return transaction.coverageRequest.findUniqueOrThrow({
          where: {
            id: coverageRequest.id,
          },
          select: {
            id: true,
            status: true,
            approvedAt: true,
            approvedByMembershipId: true,
            selectedCandidateId: true,

            shift: {
              select: {
                id: true,
                assigneeMembershipId: true,
                startAt: true,
                endAt: true,
                status: true,
              },
            },

            candidates: {
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                membershipId: true,
                type: true,
                status: true,
                respondedAt: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );
  } catch (error) {
    if (isTransactionConflictError(error)) {
      throw new AppError(
        409,
        "FINAL_APPROVAL_CONFLICT",
        "The coverage request was changed by another operation",
      );
    }

    throw error;
  }
}