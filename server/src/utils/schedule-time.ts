const SIX_HOURS_IN_MINUTES = 6 * 60;
const MILLISECONDS_PER_MINUTE =
  60 * 1000;

function getDateTimePart(
  parts: Intl.DateTimeFormatPart[],
  type: string,
): string {
  const part = parts.find(
    (item) => item.type === type,
  );

  if (!part) {
    throw new Error(
      `Missing date-time part: ${type}`,
    );
  }

  return part.value;
}

function getTimeZoneOffsetMilliseconds(
  value: Date,
  timeZone: string,
): number {
  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    },
  ).formatToParts(value);

  const representedAsUtc = Date.UTC(
    Number(getDateTimePart(parts, "year")),
    Number(getDateTimePart(parts, "month")) -
      1,
    Number(getDateTimePart(parts, "day")),
    Number(getDateTimePart(parts, "hour")),
    Number(getDateTimePart(parts, "minute")),
    Number(getDateTimePart(parts, "second")),
  );

  return representedAsUtc - value.getTime();
}

export function createDateTimeInTimeZone(
  scheduleDate: string,
  minuteOfDay: number,
  timeZone: string,
  dayOffset = 0,
): Date {
  const [
    yearText,
    monthText,
    dayText,
  ] = scheduleDate.split("-");

  if (
    !yearText ||
    !monthText ||
    !dayText ||
    !Number.isInteger(minuteOfDay) ||
    minuteOfDay < 0 ||
    minuteOfDay >= 24 * 60
  ) {
    throw new Error(
      "Invalid schedule date or minute of day",
    );
  }

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Math.floor(
    minuteOfDay / 60,
  );
  const minute = minuteOfDay % 60;

  const localTimeAsUtc = Date.UTC(
    year,
    month - 1,
    day + dayOffset,
    hour,
    minute,
  );

  const firstGuess = new Date(
    localTimeAsUtc,
  );

  const firstOffset =
    getTimeZoneOffsetMilliseconds(
      firstGuess,
      timeZone,
    );

  let result = new Date(
    localTimeAsUtc - firstOffset,
  );

  const correctedOffset =
    getTimeZoneOffsetMilliseconds(
      result,
      timeZone,
    );

  if (correctedOffset !== firstOffset) {
    result = new Date(
      localTimeAsUtc - correctedOffset,
    );
  }

  return result;
}

export function calculateBreakMinutes(
  startAt: Date,
  endAt: Date,
): number {
  const durationMinutes =
    (endAt.getTime() - startAt.getTime()) /
    MILLISECONDS_PER_MINUTE;

  return durationMinutes >=
    SIX_HOURS_IN_MINUTES
    ? 60
    : 0;
}

export function isThirtyMinuteIncrement(
  value: Date,
  timeZone: string,
): boolean {
  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    },
  ).formatToParts(value);

  const minute = Number(
    getDateTimePart(parts, "minute"),
  );

  const second = Number(
    getDateTimePart(parts, "second"),
  );

  return (
    minute % 30 === 0 &&
    second === 0 &&
    value.getUTCMilliseconds() === 0
  );
}

export function formatDateInTimeZone(
  value: Date,
  timeZone: string,
): string {
  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(value);

  const year = getDateTimePart(
    parts,
    "year",
  );
  const month = getDateTimePart(
    parts,
    "month",
  );
  const day = getDateTimePart(
    parts,
    "day",
  );

  return `${year}-${month}-${day}`;
}