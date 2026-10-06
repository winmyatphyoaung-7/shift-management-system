import {
  parseDateKey,
} from './schedule-date.ts'
import type {
  ScheduleShift,
  UpdateShiftBody,
} from './schedule-types.ts'

export type EditShiftFormInput = {
  assigneeMembershipId: string
  shiftPresetId: string
  startTime: string
  endTime: string
  note: string
}

export type EditShiftFieldErrors =
  Partial<
    Record<
      | 'form'
      | 'assigneeMembershipId'
      | 'startTime'
      | 'endTime'
      | 'note',
      string
    >
  >

type PrepareUpdateShiftResult =
  | {
      success: true
      body: UpdateShiftBody
    }
  | {
      success: false
      errors: EditShiftFieldErrors
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

export function formatShiftTime(
  dateTime: string,
): string {
  const date = new Date(dateTime)

  return [
    String(date.getHours()).padStart(
      2,
      '0',
    ),
    String(date.getMinutes()).padStart(
      2,
      '0',
    ),
  ].join(':')
}

export function prepareUpdateShiftInput(
  scheduleDate: string,
  shift: ScheduleShift,
  input: EditShiftFormInput,
): PrepareUpdateShiftResult {
  const errors:
    EditShiftFieldErrors = {}

  if (!input.assigneeMembershipId) {
    errors.assigneeMembershipId =
      '担当者を選択してください。'
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
          '開始済みの時刻には変更できません。',
      },
    }
  }

  const body: UpdateShiftBody = {}

  if (
    input.assigneeMembershipId !==
    shift.assignee.id
  ) {
    body.assigneeMembershipId =
      input.assigneeMembershipId
  }

  const currentPresetId =
    shift.shiftPreset?.id ?? ''

  if (
    input.shiftPresetId !==
    currentPresetId
  ) {
    body.shiftPresetId =
      input.shiftPresetId || null
  }

  if (
    startAt.getTime() !==
    new Date(shift.startAt).getTime()
  ) {
    body.startAt =
      startAt.toISOString()
  }

  if (
    endAt.getTime() !==
    new Date(shift.endAt).getTime()
  ) {
    body.endAt =
      endAt.toISOString()
  }

  const currentNote =
    shift.note ?? ''

  if (trimmedNote !== currentNote) {
    body.note =
      trimmedNote || null
  }

  if (Object.keys(body).length === 0) {
    return {
      success: false,
      errors: {
        form:
          '変更された項目がありません。',
      },
    }
  }

  return {
    success: true,
    body,
  }
}