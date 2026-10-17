import { AppError } from "../errors/app-error.js";
import type {
  CreateShiftsBody,
  UpdateShiftBody,
} from "../schemas/schedule-schema.js";
import {
  calculateBreakMinutes,
  formatDateInTimeZone,
  isThirtyMinuteIncrement,
} from "../utils/schedule-time.js";
import { ensureScheduleDayWithCoverageRequirements } from "./schedule-day-service.js";
import { createNotifications } from "./notification-service.js";
import { prisma } from "../lib/prisma.js";

type ShiftTimingInput = Pick<
  CreateShiftsBody,
  "scheduleDate" | "startAt" | "endAt"
>;

type ValidatedShiftTiming = {
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
};

export function validateShiftTiming(
  input: ShiftTimingInput,
  timeZone: string,
): ValidatedShiftTiming {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);

  if (endAt.getTime() <= startAt.getTime()) {
    throw new AppError(
      400,
      "INVALID_SHIFT_TIME_RANGE",
      "Shift end time must be after start time",
    );
  }

  const localStartDate =
    formatDateInTimeZone(
      startAt,
      timeZone,
    );

  if (
    localStartDate !== input.scheduleDate
  ) {
    throw new AppError(
      400,
      "SHIFT_DATE_MISMATCH",
      "Shift start time does not belong to the selected schedule date",
    );
  }

  if (
    !isThirtyMinuteIncrement(
      startAt,
      timeZone,
    ) ||
    !isThirtyMinuteIncrement(
      endAt,
      timeZone,
    )
  ) {
    throw new AppError(
      400,
      "INVALID_TIME_INCREMENT",
      "Shift times must use 30-minute increments",
    );
  }

  return {
    startAt,
    endAt,
    breakMinutes:
      calculateBreakMinutes(
        startAt,
        endAt,
      ),
  };
}

export async function createShifts(
  storeId: string,
  managerMembershipId: string,
  input: CreateShiftsBody,
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

  const timing = validateShiftTiming(
    input,
    store.timeZone,
  );

  if (
    timing.startAt.getTime() <= Date.now()
  ) {
    throw new AppError(
      409,
      "SHIFT_ALREADY_STARTED",
      "A shift cannot be created after its start time",
    );
  }

  const uniqueAssigneeIds = [
    ...new Set(
      input.assigneeMembershipIds,
    ),
  ];

  if (
    uniqueAssigneeIds.length !==
    input.assigneeMembershipIds.length
  ) {
    throw new AppError(
      400,
      "DUPLICATE_ASSIGNEE",
      "Assignee membership IDs must be unique",
    );
  }



  return prisma.$transaction(
    async (transaction) => {
      const {
        scheduleDay,
        activePresets,
      } =
        await ensureScheduleDayWithCoverageRequirements(
          {
            transaction,
            storeId,
            scheduleDate:
              input.scheduleDate,
            timeZone: store.timeZone,
          },
        );


      const assignees =
        await transaction.storeMember.findMany({
          where: {
            storeId,
            id: {
              in: uniqueAssigneeIds,
            },
          },
          select: {
            id: true,
            userId: true,
            status: true,
          },
        });

      if (
        assignees.length !==
        uniqueAssigneeIds.length
      ) {
        const foundIds = new Set(
          assignees.map(
            (assignee) => assignee.id,
          ),
        );

        const missingIds =
          uniqueAssigneeIds.filter(
            (membershipId) =>
              !foundIds.has(membershipId),
          );

        throw new AppError(
          404,
          "ASSIGNEE_NOT_FOUND",
          "One or more assignees were not found",
          {
            membershipIds: missingIds,
          },
        );
      }

      const inactiveAssigneeIds =
        assignees
          .filter(
            (assignee) =>
              assignee.status !== "ACTIVE",
          )
          .map(
            (assignee) => assignee.id,
          );

      if (
        inactiveAssigneeIds.length > 0
      ) {
        throw new AppError(
          409,
          "ASSIGNEE_INACTIVE",
          "Inactive members cannot receive new shifts",
          {
            membershipIds:
              inactiveAssigneeIds,
          },
        );
      }



      if (
        input.shiftPresetId &&
        !activePresets.some(
          (preset) =>
            preset.id ===
            input.shiftPresetId,
        )
      ) {
        throw new AppError(
          404,
          "SHIFT_PRESET_NOT_FOUND",
          "Active shift preset not found",
        );
      }

      const overlappingShift =
        await transaction.shift.findFirst({
          where: {
            assigneeMembershipId: {
              in: uniqueAssigneeIds,
            },
            status: "ACTIVE",
            startAt: {
              lt: timing.endAt,
            },
            endAt: {
              gt: timing.startAt,
            },
          },
          select: {
            id: true,
            assigneeMembershipId: true,
          },
        });

      if (overlappingShift) {
        throw new AppError(
          409,
          "SHIFT_OVERLAP",
          "An assignee already has an overlapping shift",
          {
            shiftId:
              overlappingShift.id,
            membershipId:
              overlappingShift.assigneeMembershipId,
          },
        );
      }

      const adjacentShifts =
        await transaction.shift.findMany({
          where: {
            assigneeMembershipId: {
              in: uniqueAssigneeIds,
            },
            status: "ACTIVE",
            OR: [
              {
                endAt: timing.startAt,
              },
              {
                startAt: timing.endAt,
              },
            ],
          },
          select: {
            assigneeMembershipId: true,
          },
        });



      const shifts = [];

      for (
        const assigneeMembershipId of
        uniqueAssigneeIds
      ) {
        const shift =
          await transaction.shift.create({
            data: {
              scheduleDayId:
                scheduleDay.id,
              assigneeMembershipId,
              shiftPresetId:
                input.shiftPresetId ??
                null,
              startAt: timing.startAt,
              endAt: timing.endAt,
              breakMinutes:
                timing.breakMinutes,
              status: "ACTIVE",
              note: input.note || null,
              createdByMembershipId:
                managerMembershipId,
              updatedByMembershipId:
                managerMembershipId,
            },
            select: {
              id: true,
              scheduleDayId: true,
              assigneeMembershipId: true,
              shiftPresetId: true,
              startAt: true,
              endAt: true,
              breakMinutes: true,
              status: true,
              note: true,
              createdAt: true,
              updatedAt: true,
            },
          });

        shifts.push(shift);
      }

      if (
        scheduleDay.status === "PUBLISHED"
      ) {
        const notificationInputs =
          shifts.flatMap((shift) => {
            if (
              shift.assigneeMembershipId ===
              managerMembershipId
            ) {
              return [];
            }

            const assignee =
              assignees.find(
                (member) =>
                  member.id ===
                  shift.assigneeMembershipId,
              );

            if (!assignee) {
              return [];
            }

            return [
              {
                recipientUserId:
                  assignee.userId,
                storeId,
                type:
                  "PUBLISHED_SHIFT_ASSIGNED" as const,
                title: "Published shift assigned",
                message:
                  "A new shift was added to a published schedule and assigned to you.",
                referenceData: {
                  shiftId: shift.id,
                  scheduleDayId:
                    scheduleDay.id,
                  scheduleDate:
                    input.scheduleDate,
                  startAt:
                    shift.startAt.toISOString(),
                  endAt:
                    shift.endAt.toISOString(),
                },
              },
            ];
          });

        await createNotifications(
          transaction,
          notificationInputs,
        );
      }

      const adjacentMembershipIds = [
        ...new Set(
          adjacentShifts.map(
            (shift) =>
              shift.assigneeMembershipId,
          ),
        ),
      ];

      return {
        shifts,
        warnings:
          adjacentMembershipIds.map(
            (membershipId) => ({
              code: "ADJACENT_SHIFT",
              membershipId,
              message:
                "This member has an adjacent shift",
            }),
          ),
      };
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function updateShift(
  storeId: string,
  shiftId: string,
  managerMembershipId: string,
  input: UpdateShiftBody,
) {
  return prisma.$transaction(
    async (transaction) => {
      const existingShift =
        await transaction.shift.findFirst({
          where: {
            id: shiftId,
            scheduleDay: {
              storeId,
            },
          },
          select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            note: true,
            assigneeMembershipId: true,
            shiftPresetId: true,

            assignee: {
              select: {
                userId: true,
              },
            },

            coverageRequests: {
              where: {
                status: {
                  in: [
                    "PENDING_REVIEW",
                    "OPEN",
                  ],
                },
              },
              take: 1,
              select: {
                id: true,
                status: true,
              },
            },

            scheduleDay: {
              select: {
                status: true,
                scheduleDate: true,

                store: {
                  select: {
                    timeZone: true,
                  },
                },
              },
            },
          },
        });

      if (!existingShift) {
        throw new AppError(
          404,
          "SHIFT_NOT_FOUND",
          "Shift not found",
        );
      }

      if (
        existingShift.coverageRequests.length >
        0
      ) {
        throw new AppError(
          409,
          "SHIFT_HAS_ACTIVE_COVERAGE_REQUEST",
          "A shift with an active coverage request cannot be edited",
          {
            coverageRequestId:
              existingShift.coverageRequests[0]
                ?.id,
          },
        );
      }



      if (
        existingShift.status !== "ACTIVE"
      ) {
        throw new AppError(
          409,
          "SHIFT_NOT_ACTIVE",
          "Only active shifts can be edited",
        );
      }

      if (
        existingShift.startAt.getTime() <=
        Date.now()
      ) {
        throw new AppError(
          409,
          "SHIFT_ALREADY_STARTED",
          "A shift cannot be edited after its start time",
        );
      }

      const finalStartAt =
        input.startAt !== undefined
          ? new Date(input.startAt)
          : existingShift.startAt;

      const finalEndAt =
        input.endAt !== undefined
          ? new Date(input.endAt)
          : existingShift.endAt;

      const scheduleDate =
        existingShift.scheduleDay.scheduleDate
          .toISOString()
          .slice(0, 10);

      const timing = validateShiftTiming(
        {
          scheduleDate,
          startAt:
            finalStartAt.toISOString(),
          endAt:
            finalEndAt.toISOString(),
        },
        existingShift.scheduleDay.store
          .timeZone,
      );

      if (
        timing.startAt.getTime() <=
        Date.now()
      ) {
        throw new AppError(
          409,
          "SHIFT_ALREADY_STARTED",
          "A shift cannot be moved to a time that has already started",
        );
      }

      const finalAssigneeMembershipId =
        input.assigneeMembershipId ??
        existingShift.assigneeMembershipId;

      const assignee =
        await transaction.storeMember.findFirst({
          where: {
            id: finalAssigneeMembershipId,
            storeId,
          },
          select: {
            status: true,
            userId: true,
          },
        });

      if (!assignee) {
        throw new AppError(
          404,
          "ASSIGNEE_NOT_FOUND",
          "Assignee was not found",
        );
      }

      if (assignee.status !== "ACTIVE") {
        throw new AppError(
          409,
          "ASSIGNEE_INACTIVE",
          "Inactive members cannot receive new shifts",
        );
      }

      const finalShiftPresetId =
        input.shiftPresetId === undefined
          ? existingShift.shiftPresetId
          : input.shiftPresetId;

      if (
        input.shiftPresetId !==
        undefined &&
        input.shiftPresetId !== null
      ) {
        const shiftPreset =
          await transaction.shiftPreset.findFirst({
            where: {
              id: input.shiftPresetId,
              storeId,
              isActive: true,
            },
            select: {
              id: true,
            },
          });

        if (!shiftPreset) {
          throw new AppError(
            404,
            "SHIFT_PRESET_NOT_FOUND",
            "Active shift preset not found",
          );
        }
      }

      const overlappingShift =
        await transaction.shift.findFirst({
          where: {
            id: {
              not: existingShift.id,
            },
            assigneeMembershipId:
              finalAssigneeMembershipId,
            status: "ACTIVE",
            startAt: {
              lt: timing.endAt,
            },
            endAt: {
              gt: timing.startAt,
            },
          },
          select: {
            id: true,
          },
        });

      if (overlappingShift) {
        throw new AppError(
          409,
          "SHIFT_OVERLAP",
          "The assignee already has an overlapping shift",
          {
            shiftId:
              overlappingShift.id,
            membershipId:
              finalAssigneeMembershipId,
          },
        );
      }

      const adjacentShift =
        await transaction.shift.findFirst({
          where: {
            id: {
              not: existingShift.id,
            },
            assigneeMembershipId:
              finalAssigneeMembershipId,
            status: "ACTIVE",
            OR: [
              {
                endAt: timing.startAt,
              },
              {
                startAt: timing.endAt,
              },
            ],
          },
          select: {
            id: true,
          },
        });

      const publishedShift =
        existingShift.scheduleDay.status ===
        "PUBLISHED";

      const timeChanged =
        existingShift.startAt.getTime() !==
        timing.startAt.getTime() ||
        existingShift.endAt.getTime() !==
        timing.endAt.getTime();

      const assigneeChanged =
        existingShift.assigneeMembershipId !==
        finalAssigneeMembershipId;

      const updatedShift =
        await transaction.shift.update({
          where: {
            id: existingShift.id,
          },
          data: {
            assigneeMembershipId:
              finalAssigneeMembershipId,
            shiftPresetId:
              finalShiftPresetId,
            startAt: timing.startAt,
            endAt: timing.endAt,
            breakMinutes:
              timing.breakMinutes,
            note:
              input.note === undefined
                ? existingShift.note
                : input.note || null,
            updatedByMembershipId:
              managerMembershipId,
          },
          select: {
            id: true,
            scheduleDayId: true,
            assigneeMembershipId: true,
            shiftPresetId: true,
            startAt: true,
            endAt: true,
            breakMinutes: true,
            status: true,
            note: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      if (
        publishedShift &&
        timeChanged &&
        finalAssigneeMembershipId !==
        managerMembershipId
      ) {
        await createNotifications(
          transaction,
          [
            {
              recipientUserId: assignee.userId,
              storeId,
              type:
                "PUBLISHED_SHIFT_TIME_CHANGED",
              title: "Shift time changed",
              message:
                "The time of one of your published shifts was changed.",
              referenceData: {
                shiftId: existingShift.id,
                scheduleDate,
                previousStartAt:
                  existingShift.startAt.toISOString(),
                previousEndAt:
                  existingShift.endAt.toISOString(),
                startAt:
                  updatedShift.startAt.toISOString(),
                endAt:
                  updatedShift.endAt.toISOString(),
              },
            },
          ],
        );
      }

      if (publishedShift && assigneeChanged) {
        const recipientUserIds =
          new Set<string>();

        if (
          existingShift.assigneeMembershipId !==
          managerMembershipId
        ) {
          recipientUserIds.add(
            existingShift.assignee.userId,
          );
        }

        if (
          finalAssigneeMembershipId !==
          managerMembershipId
        ) {
          recipientUserIds.add(
            assignee.userId,
          );
        }

        await createNotifications(
          transaction,
          [...recipientUserIds].map(
            (recipientUserId) => ({
              recipientUserId,
              storeId,
              type:
                "PUBLISHED_SHIFT_REASSIGNED",
              title: "Shift reassigned",
              message:
                "A published shift was reassigned.",
              referenceData: {
                shiftId: existingShift.id,
                scheduleDate,
                previousAssigneeMembershipId:
                  existingShift
                    .assigneeMembershipId,
                assigneeMembershipId:
                  finalAssigneeMembershipId,
                startAt:
                  updatedShift.startAt.toISOString(),
                endAt:
                  updatedShift.endAt.toISOString(),
              },
            }),
          ),
        );
      }

      return {
        shift: updatedShift,
        warnings: adjacentShift
          ? [
            {
              code:
                "ADJACENT_SHIFT",
              membershipId:
                finalAssigneeMembershipId,
              message:
                "This member has an adjacent shift",
            },
          ]
          : [],
      };
    },
    {
      isolationLevel: "Serializable",
    },
  );
}

export async function removeShift(
  storeId: string,
  shiftId: string,
  managerMembershipId: string,
): Promise<{
  action: "DELETED" | "CANCELLED";
}> {
  return prisma.$transaction(
    async (transaction) => {
      const shift =
        await transaction.shift.findFirst({
          where: {
            id: shiftId,
            scheduleDay: {
              storeId,
            },
          },
          select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            assigneeMembershipId: true,

            assignee: {
              select: {
                userId: true,
              },
            },

            coverageRequests: {
              where: {
                status: {
                  in: [
                    "PENDING_REVIEW",
                    "OPEN",
                  ],
                },
              },
              take: 1,
              select: {
                id: true,
                status: true,
              },
            },

            scheduleDay: {
              select: {
                status: true,
                scheduleDate: true,
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

      if (shift.coverageRequests.length > 0) {
        throw new AppError(
          409,
          "SHIFT_HAS_ACTIVE_COVERAGE_REQUEST",
          "A shift with an active coverage request cannot be deleted or cancelled",
          {
            coverageRequestId:
              shift.coverageRequests[0]?.id,
          },
        );
      }

      if (shift.status === "CANCELLED") {
        throw new AppError(
          409,
          "SHIFT_ALREADY_CANCELLED",
          "Shift is already cancelled",
        );
      }

      if (
        shift.startAt.getTime() <=
        Date.now()
      ) {
        throw new AppError(
          409,
          "SHIFT_ALREADY_STARTED",
          "A shift cannot be deleted or cancelled after its start time",
        );
      }

      if (
        shift.scheduleDay.status ===
        "DRAFT"
      ) {
        await transaction.shift.delete({
          where: {
            id: shift.id,
          },
        });

        return {
          action: "DELETED",
        };
      }

      await transaction.shift.update({
        where: {
          id: shift.id,
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledByMembershipId:
            managerMembershipId,
          updatedByMembershipId:
            managerMembershipId,
        },
      });

      if (
        shift.assigneeMembershipId !==
        managerMembershipId
      ) {
        await createNotifications(
          transaction,
          [
            {
              recipientUserId:
                shift.assignee.userId,
              storeId,
              type:
                "PUBLISHED_SHIFT_CANCELLED",
              title: "Shift cancelled",
              message:
                "One of your published shifts was cancelled.",
              referenceData: {
                shiftId: shift.id,
                scheduleDate:
                  shift.scheduleDay.scheduleDate
                    .toISOString()
                    .slice(0, 10),
                startAt:
                  shift.startAt.toISOString(),
                endAt:
                  shift.endAt.toISOString(),
              },
            },
          ],
        );
      }

      return {
        action: "CANCELLED",
      };
    },
    {
      isolationLevel: "Serializable",
    },
  );
}