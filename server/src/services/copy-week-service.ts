import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import type { CopyWeekBody } from "../schemas/schedule-schema.js";
import { ensureScheduleDayWithCoverageRequirements } from "./schedule-day-service.js";

const DAYS_IN_WEEK = 7;
const MILLISECONDS_IN_DAY =
  24 * 60 * 60 * 1000;

type CopyWeekWarning = {
  code: "INACTIVE_ASSIGNEE_SKIPPED";
  shiftId: string;
  membershipId: string;
  message: string;
};

function addDaysToDateString(
  value: string,
  days: number,
): string {
  const date = new Date(
    `${value}T00:00:00.000Z`,
  );

  date.setUTCDate(
    date.getUTCDate() + days,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function addDaysToDateTime(
  value: Date,
  days: number,
): Date {
  return new Date(
    value.getTime() +
      days * MILLISECONDS_IN_DAY,
  );
}

export async function copyScheduleWeek(
  storeId: string,
  managerMembershipId: string,
  input: CopyWeekBody,
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

  const sourceWeekEnd =
    addDaysToDateString(
      input.sourceWeekStart,
      DAYS_IN_WEEK - 1,
    );

  const targetWeekEnd =
    addDaysToDateString(
      input.targetWeekStart,
      DAYS_IN_WEEK - 1,
    );

  return prisma.$transaction(
    async (transaction) => {
      const existingTargetDay =
        await transaction.scheduleDay.findFirst({
          where: {
            storeId,
            scheduleDate: {
              gte: new Date(
                `${input.targetWeekStart}T00:00:00.000Z`,
              ),
              lte: new Date(
                `${targetWeekEnd}T00:00:00.000Z`,
              ),
            },
          },
          select: {
            scheduleDate: true,
          },
        });

      if (existingTargetDay) {
        throw new AppError(
          409,
          "TARGET_WEEK_NOT_EMPTY",
          "The target week must be completely empty",
          {
            scheduleDate:
              existingTargetDay.scheduleDate
                .toISOString()
                .slice(0, 10),
          },
        );
      }

      const sourceScheduleDays =
        await transaction.scheduleDay.findMany({
          where: {
            storeId,
            scheduleDate: {
              gte: new Date(
                `${input.sourceWeekStart}T00:00:00.000Z`,
              ),
              lte: new Date(
                `${sourceWeekEnd}T00:00:00.000Z`,
              ),
            },
          },
          orderBy: {
            scheduleDate: "asc",
          },
          select: {
            scheduleDate: true,

            shifts: {
              where: {
                status: "ACTIVE",
              },
              orderBy: {
                startAt: "asc",
              },
              select: {
                id: true,
                assigneeMembershipId: true,
                shiftPresetId: true,
                startAt: true,
                endAt: true,
                breakMinutes: true,
                note: true,

                assignee: {
                  select: {
                    status: true,
                  },
                },
              },
            },
          },
        });

      const sourceShifts =
        sourceScheduleDays.flatMap(
          (scheduleDay) => {
            const sourceScheduleDate =
              scheduleDay.scheduleDate
                .toISOString()
                .slice(0, 10);

            return scheduleDay.shifts.map(
              (shift) => ({
                ...shift,
                sourceScheduleDate,
              }),
            );
          },
        );

      const warnings: CopyWeekWarning[] =
        sourceShifts
          .filter(
            (shift) =>
              shift.assignee.status !==
              "ACTIVE",
          )
          .map((shift) => ({
            code:
              "INACTIVE_ASSIGNEE_SKIPPED",
            shiftId: shift.id,
            membershipId:
              shift.assigneeMembershipId,
            message:
              "A shift assigned to an inactive member will be skipped",
          }));

      const copyableShifts =
        sourceShifts.filter(
          (shift) =>
            shift.assignee.status ===
            "ACTIVE",
        );

      const alreadyStartedTargetShift =
        copyableShifts.find(
          (shift) =>
            addDaysToDateTime(
              shift.startAt,
              DAYS_IN_WEEK,
            ).getTime() <= Date.now(),
        );

      if (alreadyStartedTargetShift) {
        throw new AppError(
          409,
          "TARGET_SHIFT_ALREADY_STARTED",
          "The target week contains a shift time that has already started",
          {
            sourceShiftId:
              alreadyStartedTargetShift.id,
          },
        );
      }

      const preview = {
        sourceWeek: {
          from: input.sourceWeekStart,
          to: sourceWeekEnd,
        },
        targetWeek: {
          from: input.targetWeekStart,
          to: targetWeekEnd,
        },
        sourceShiftCount:
          sourceShifts.length,
        copyableShiftCount:
          copyableShifts.length,
        skippedShiftCount:
          warnings.length,
        warnings,
      };

      if (!input.confirmed) {
        return {
          copied: false,
          preview,
        };
      }

      const targetScheduleDayIds =
        new Map<string, string>();

      for (
        let dayOffset = 0;
        dayOffset < DAYS_IN_WEEK;
        dayOffset += 1
      ) {
        const targetScheduleDate =
          addDaysToDateString(
            input.targetWeekStart,
            dayOffset,
          );

        const { scheduleDay } =
          await ensureScheduleDayWithCoverageRequirements(
            {
              transaction,
              storeId,
              scheduleDate:
                targetScheduleDate,
              timeZone: store.timeZone,
            },
          );

        targetScheduleDayIds.set(
          targetScheduleDate,
          scheduleDay.id,
        );
      }

      const copiedShiftData =
        copyableShifts.map((shift) => {
          const targetScheduleDate =
            addDaysToDateString(
              shift.sourceScheduleDate,
              DAYS_IN_WEEK,
            );

          const targetScheduleDayId =
            targetScheduleDayIds.get(
              targetScheduleDate,
            );

          if (!targetScheduleDayId) {
            throw new Error(
              "Target schedule day was not created",
            );
          }

          return {
            scheduleDayId:
              targetScheduleDayId,
            assigneeMembershipId:
              shift.assigneeMembershipId,
            shiftPresetId:
              shift.shiftPresetId,
            startAt:
              addDaysToDateTime(
                shift.startAt,
                DAYS_IN_WEEK,
              ),
            endAt:
              addDaysToDateTime(
                shift.endAt,
                DAYS_IN_WEEK,
              ),
            breakMinutes:
              shift.breakMinutes,
            note: shift.note,
            createdByMembershipId:
              managerMembershipId,
            updatedByMembershipId:
              managerMembershipId,
          };
        });

      if (copiedShiftData.length > 0) {
        await transaction.shift.createMany({
          data: copiedShiftData,
        });
      }

      return {
        copied: true,
        preview,
        createdScheduleDayCount:
          DAYS_IN_WEEK,
        createdShiftCount:
          copiedShiftData.length,
      };
    },
    {
      isolationLevel: "Serializable",
    },
  );
}