import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import type {
  ApproveCoverageRequestBody,
  CreateStaffCoverageRequestBody,
  ListManagerCoverageRequestsQuery,
  RejectCoverageRequestBody,
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