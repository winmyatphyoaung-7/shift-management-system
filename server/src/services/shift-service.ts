import { AppError } from "../errors/app-error.js";
import type { CreateShiftsBody } from "../schemas/schedule-schema.js";
import {
  calculateBreakMinutes,
  createDateTimeInTimeZone,
  formatDateInTimeZone,
  isThirtyMinuteIncrement,
} from "../utils/schedule-time.js";
import { prisma } from "../lib/prisma.js";

type ValidatedShiftTiming = {
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
};

export function validateShiftTiming(
  input: CreateShiftsBody,
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

export async function createDraftShifts(
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

  const scheduleDate = new Date(
    `${input.scheduleDate}T00:00:00.000Z`,
  );

  return prisma.$transaction(
    async (transaction) => {
      const existingScheduleDay =
        await transaction.scheduleDay.findUnique({
          where: {
            storeId_scheduleDate: {
              storeId,
              scheduleDate,
            },
          },
          select: {
            id: true,
            status: true,
          },
        });

      if (
        existingScheduleDay?.status ===
        "PUBLISHED"
      ) {
        throw new AppError(
          409,
          "SCHEDULE_DAY_ALREADY_PUBLISHED",
          "New draft shifts cannot be added to a published schedule day",
        );
      }

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

      const activePresets =
        await transaction.shiftPreset.findMany({
          where: {
            storeId,
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

      const scheduleDay =
        existingScheduleDay ??
        (await transaction.scheduleDay.create({
          data: {
            storeId,
            scheduleDate,
          },
          select: {
            id: true,
            status: true,
          },
        }));

      await transaction.coverageRequirement.createMany({
        data: activePresets.map(
          (preset) => ({
            scheduleDayId:
              scheduleDay.id,
            shiftPresetId: preset.id,

            startAt:
              createDateTimeInTimeZone(
                input.scheduleDate,
                preset.startMinute,
                store.timeZone,
              ),

            endAt:
              createDateTimeInTimeZone(
                input.scheduleDate,
                preset.endMinute,
                store.timeZone,
                preset.crossesMidnight
                  ? 1
                  : 0,
              ),

            requiredCount:
              preset.defaultRequiredCount,
          }),
        ),
        skipDuplicates: true,
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