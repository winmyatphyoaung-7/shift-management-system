import {
  parseDateKey,
} from './schedule-date.ts'
import type {
  CreateShiftsInput,
} from './schedule-types.ts'

export type CreateShiftFormInput = {
  shiftPresetId: string
  assigneeMembershipIds: string[]
  startTime: string
  endTime: string
  note: string
}

export type CreateShiftFieldErrors =
  Partial<
    Record<
      | 'assigneeMembershipIds'
      | 'startTime'
      | 'endTime'
      | 'note',
      string
    >
  >

type PrepareCreateShiftsResult =
  | {
      success: true
      body: CreateShiftsInput
    }
  | {
      success: false
      errors: CreateShiftFieldErrors
    }

function parseTime(
  value: string,
): {
  hours: number
  minutes: number
} | null {
  const match =
    /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
      value,
    )

  if (!match) {
    return null
  }

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  }
}

function createDateTime(
  scheduleDate: string,
  time: {
    hours: number
    minutes: number
  },
): Date {
  const date =
    parseDateKey(scheduleDate)

  date.setHours(
    time.hours,
    time.minutes,
    0,
    0,
  )

  return date
}

export function formatMinuteOfDay(
  minuteOfDay: number,
): string {
  const hours = Math.floor(
    minuteOfDay / 60,
  )
  const minutes =
    minuteOfDay % 60

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
  ].join(':')
}

export function prepareCreateShiftsInput(
  scheduleDate: string,
  input: CreateShiftFormInput,
): PrepareCreateShiftsResult {
  const errors:
    CreateShiftFieldErrors = {}

  const uniqueAssigneeIds = [
    ...new Set(
      input.assigneeMembershipIds,
    ),
  ]

  if (uniqueAssigneeIds.length === 0) {
    errors.assigneeMembershipIds =
      '担当者を1人以上選択してください。'
  }

  const startTime =
    parseTime(input.startTime)

  const endTime =
    parseTime(input.endTime)

  if (!startTime) {
    errors.startTime =
      '開始時刻を入力してください。'
  } else if (
    startTime.minutes % 30 !== 0
  ) {
    errors.startTime =
      '開始時刻は30分単位で入力してください。'
  }

  if (!endTime) {
    errors.endTime =
      '終了時刻を入力してください。'
  } else if (
    endTime.minutes % 30 !== 0
  ) {
    errors.endTime =
      '終了時刻は30分単位で入力してください。'
  }

  if (
    startTime &&
    endTime &&
    input.startTime === input.endTime
  ) {
    errors.endTime =
      '開始時刻と終了時刻を同じにすることはできません。'
  }

  const trimmedNote =
    input.note.trim()

  if (trimmedNote.length > 500) {
    errors.note =
      'メモは500文字以内で入力してください。'
  }

  if (
    Object.keys(errors).length > 0 ||
    !startTime ||
    !endTime
  ) {
    return {
      success: false,
      errors,
    }
  }

  const startAt =
    createDateTime(
      scheduleDate,
      startTime,
    )

  const endAt =
    createDateTime(
      scheduleDate,
      endTime,
    )

  if (
    endAt.getTime() <
    startAt.getTime()
  ) {
    endAt.setDate(
      endAt.getDate() + 1,
    )
  }

  if (
    startAt.getTime() <= Date.now()
  ) {
    return {
      success: false,
      errors: {
        startTime:
          '開始済みの時刻にはシフトを作成できません。',
      },
    }
  }

  return {
    success: true,
    body: {
      scheduleDate,
      assigneeMembershipIds:
        uniqueAssigneeIds,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),

      ...(input.shiftPresetId
        ? {
            shiftPresetId:
              input.shiftPresetId,
          }
        : {}),

      ...(trimmedNote
        ? {
            note: trimmedNote,
          }
        : {}),
    },
  }
}
