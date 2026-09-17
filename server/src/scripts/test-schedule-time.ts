import {
  calculateBreakMinutes,
  createDateTimeInTimeZone,
  isThirtyMinuteIncrement,
} from "../utils/schedule-time.js";

const timeZone = "Asia/Tokyo";
const scheduleDate = "2026-09-21";

const morningStart =
  createDateTimeInTimeZone(
    scheduleDate,
    8 * 60,
    timeZone,
  );

const morningEnd =
  createDateTimeInTimeZone(
    scheduleDate,
    13 * 60,
    timeZone,
  );

const nightStart =
  createDateTimeInTimeZone(
    scheduleDate,
    22 * 60,
    timeZone,
  );

const nightEnd =
  createDateTimeInTimeZone(
    scheduleDate,
    8 * 60,
    timeZone,
    1,
  );

console.log(
  JSON.stringify(
    {
      morning: {
        startUtc:
          morningStart.toISOString(),
        endUtc:
          morningEnd.toISOString(),
        breakMinutes:
          calculateBreakMinutes(
            morningStart,
            morningEnd,
          ),
      },

      night: {
        startUtc:
          nightStart.toISOString(),
        endUtc:
          nightEnd.toISOString(),
        breakMinutes:
          calculateBreakMinutes(
            nightStart,
            nightEnd,
          ),
      },

      thirtyMinuteIncrement: {
        valid:
          isThirtyMinuteIncrement(
            new Date(
              "2026-09-21T08:30:00+09:00",
            ),
            timeZone,
          ),

        invalid:
          isThirtyMinuteIncrement(
            new Date(
              "2026-09-21T08:15:00+09:00",
            ),
            timeZone,
          ),
      },
    },
    null,
    2,
  ),
);