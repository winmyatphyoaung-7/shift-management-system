import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { calculateUnderstaffedIntervals } from "../utils/coverage.js";

export async function updateCoverageRequirement(
  storeId: string,
  coverageRequirementId: string,
  requiredCount: number,
) {
  return prisma.$transaction(async (tx) => {
    const existingRequirement =
      await tx.coverageRequirement.findFirst({
        where: {
          id: coverageRequirementId,
          scheduleDay: {
            storeId,
          },
        },
        select: {
          id: true,
          scheduleDayId: true,
        },
      });

    if (!existingRequirement) {
      throw new AppError(
        404,
        "COVERAGE_REQUIREMENT_NOT_FOUND",
        "Coverage requirement not found",
      );
    }

    const coverageRequirement =
      await tx.coverageRequirement.update({
        where: {
          id: coverageRequirementId,
        },
        data: {
          requiredCount,
        },
        select: {
          id: true,
          scheduleDayId: true,
          shiftPresetId: true,
          startAt: true,
          endAt: true,
          requiredCount: true,
          createdAt: true,
          updatedAt: true,
          shiftPreset: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    const scheduleDay =
      await tx.scheduleDay.findUniqueOrThrow({
        where: {
          id: existingRequirement.scheduleDayId,
        },
        select: {
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
      });

    const warnings =
      calculateUnderstaffedIntervals(
        scheduleDay.coverageRequirements.map(
          (requirement) => ({
            id: requirement.id,
            shiftPresetId:
              requirement.shiftPresetId,
            shiftPresetName:
              requirement.shiftPreset.name,
            startAt: requirement.startAt,
            endAt: requirement.endAt,
            requiredCount:
              requirement.requiredCount,
          }),
        ),
        scheduleDay.shifts,
      );

    return {
      coverageRequirement,
      warnings,
    };
  });
}