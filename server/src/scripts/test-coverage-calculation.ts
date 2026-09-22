import {
  calculateUnderstaffedIntervals,
  type CoverageRequirementInput,
  type CoverageShiftInput,
} from "../utils/coverage.js";

const requirements: CoverageRequirementInput[] =
  [
    {
      id: "afternoon-requirement",
      shiftPresetId: "afternoon-preset",
      shiftPresetName: "Afternoon",
      startAt: new Date(
        "2026-10-01T13:00:00.000Z",
      ),
      endAt: new Date(
        "2026-10-01T17:00:00.000Z",
      ),
      requiredCount: 2,
    },
    {
      id: "evening-requirement",
      shiftPresetId: "evening-preset",
      shiftPresetName: "Evening",
      startAt: new Date(
        "2026-10-01T17:00:00.000Z",
      ),
      endAt: new Date(
        "2026-10-01T18:00:00.000Z",
      ),
      requiredCount: 2,
    },
  ];

const shifts: CoverageShiftInput[] = [
  {
    assigneeMembershipId: "member-a",
    startAt: new Date(
      "2026-10-01T13:00:00.000Z",
    ),
    endAt: new Date(
      "2026-10-01T18:00:00.000Z",
    ),
    status: "ACTIVE",
  },
  {
    assigneeMembershipId: "member-b",
    startAt: new Date(
      "2026-10-01T13:30:00.000Z",
    ),
    endAt: new Date(
      "2026-10-01T17:30:00.000Z",
    ),
    status: "ACTIVE",
  },
  {
    assigneeMembershipId: "member-c",
    startAt: new Date(
      "2026-10-01T13:00:00.000Z",
    ),
    endAt: new Date(
      "2026-10-01T18:00:00.000Z",
    ),
    status: "CANCELLED",
  },
];

const warnings =
  calculateUnderstaffedIntervals(
    requirements,
    shifts,
  );

if (warnings.length !== 2) {
  throw new Error(
    `Expected 2 warnings but received ${warnings.length}`,
  );
}

console.log(
  JSON.stringify(
    {
      warningCount: warnings.length,
      warnings,
    },
    null,
    2,
  ),
);