import type { ScheduleDateRange } from './schedule-types.ts'

function formatDatePart(
  value: number,
): string {
  return String(value).padStart(
    2,
    '0',
  )
}

export function formatDateKey(
  date: Date,
): string {
  const year = date.getFullYear()
  const month = formatDatePart(
    date.getMonth() + 1,
  )
  const day = formatDatePart(
    date.getDate(),
  )

  return `${year}-${month}-${day}`
}

export function parseDateKey(
  value: string,
): Date {
  const [year, month, day] =
    value.split('-').map(Number)

  return new Date(
    year ?? 0,
    (month ?? 1) - 1,
    day ?? 1,
  )
}

export function addDays(
  value: string,
  numberOfDays: number,
): string {
  const date = parseDateKey(value)

  date.setDate(
    date.getDate() + numberOfDays,
  )

  return formatDateKey(date)
}

export function getWeekRange(
  referenceDate = new Date(),
): ScheduleDateRange {
  const monday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )

  const dayOfWeek = monday.getDay()

  const daysFromMonday =
    dayOfWeek === 0
      ? 6
      : dayOfWeek - 1

  monday.setDate(
    monday.getDate() - daysFromMonday,
  )

  const from = formatDateKey(monday)

  return {
    from,
    to: addDays(from, 6),
  }
}

export function shiftDateRange(
  range: ScheduleDateRange,
  numberOfDays: number,
): ScheduleDateRange {
  return {
    from: addDays(
      range.from,
      numberOfDays,
    ),
    to: addDays(
      range.to,
      numberOfDays,
    ),
  }
}