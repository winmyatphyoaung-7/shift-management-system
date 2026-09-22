const COVERAGE_INTERVAL_MINUTES = 30;

const COVERAGE_INTERVAL_MS =
  COVERAGE_INTERVAL_MINUTES * 60 * 1000;

export type CoverageRequirementInput = {
  id: string;
  shiftPresetId: string;
  shiftPresetName: string;
  startAt: Date;
  endAt: Date;
  requiredCount: number;
};

export type CoverageShiftInput = {
  assigneeMembershipId: string;
  startAt: Date;
  endAt: Date;
  status: "ACTIVE" | "CANCELLED";
};

export type UnderstaffedInterval = {
  code: "UNDERSTAFFED";
  coverageRequirementId: string;
  shiftPresetId: string;
  shiftPresetName: string;
  startAt: Date;
  endAt: Date;
  requiredCount: number;
  assignedCount: number;
  shortageCount: number;
};

export function calculateUnderstaffedIntervals(
  requirements: CoverageRequirementInput[],
  shifts: CoverageShiftInput[],
): UnderstaffedInterval[] {
  const activeShifts = shifts.filter(
    (shift) => shift.status === "ACTIVE",
  );

  const warnings: UnderstaffedInterval[] = [];

  for (const requirement of requirements) {
    const requirementEnd =
      requirement.endAt.getTime();

    for (
      let intervalStart =
        requirement.startAt.getTime();
      intervalStart < requirementEnd;
      intervalStart += COVERAGE_INTERVAL_MS
    ) {
      const intervalEnd = Math.min(
        intervalStart + COVERAGE_INTERVAL_MS,
        requirementEnd,
      );

      const assignedMembershipIds = new Set(
        activeShifts
          .filter(
            (shift) =>
              shift.startAt.getTime() <
                intervalEnd &&
              shift.endAt.getTime() >
                intervalStart,
          )
          .map(
            (shift) =>
              shift.assigneeMembershipId,
          ),
      );

      const assignedCount =
        assignedMembershipIds.size;

      if (
        assignedCount <
        requirement.requiredCount
      ) {
        warnings.push({
          code: "UNDERSTAFFED",
          coverageRequirementId:
            requirement.id,
          shiftPresetId:
            requirement.shiftPresetId,
          shiftPresetName:
            requirement.shiftPresetName,
          startAt: new Date(intervalStart),
          endAt: new Date(intervalEnd),
          requiredCount:
            requirement.requiredCount,
          assignedCount,
          shortageCount:
            requirement.requiredCount -
            assignedCount,
        });
      }
    }
  }

  return warnings;
}