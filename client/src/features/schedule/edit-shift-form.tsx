import {
  useState,
  type FormEvent,
} from 'react'

import { toApiError } from '../../lib/api-error.ts'
import { useMembers } from '../members/member-hooks.ts'
import {
  formatMinuteOfDay,
} from './create-shift-validation.ts'
import {
  formatShiftTime,
  prepareUpdateShiftInput,
  type EditShiftFieldErrors,
  type EditShiftFormInput,
} from './edit-shift-validation.ts'
import {
  useUpdateShift,
} from './schedule-hooks.ts'
import type {
  ScheduleCoveragePreset,
  ScheduleShift,
  UpdateShiftResult,
} from './schedule-types.ts'

type EditShiftFormProps = {
  scheduleDate: string
  shift: ScheduleShift
  presets: ScheduleCoveragePreset[]
  onCancel: () => void
  onUpdated: (
    result: UpdateShiftResult,
  ) => void
}

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

function getInitialInput(
  shift: ScheduleShift,
): EditShiftFormInput {
  return {
    assigneeMembershipId:
      shift.assignee.id,
    shiftPresetId:
      shift.shiftPreset?.id ?? '',
    startTime:
      formatShiftTime(shift.startAt),
    endTime:
      formatShiftTime(shift.endAt),
    note: shift.note ?? '',
  }
}

function getApiErrorMessage(
  code: string,
  fallbackMessage: string,
): string {
  const messages: Record<
    string,
    string
  > = {
    SHIFT_NOT_FOUND:
      '対象のシフトが見つかりません。',
    SHIFT_NOT_ACTIVE:
      'キャンセル済みのシフトは編集できません。',
    SHIFT_ALREADY_STARTED:
      '開始済みのシフトは編集できません。',
    SHIFT_OVERLAP:
      '選択した担当者に重複するシフトがあります。',
    SHIFT_DATE_MISMATCH:
      '開始時刻が対象日と一致しません。',
    INVALID_TIME_INCREMENT:
      'シフト時刻は30分単位で入力してください。',
    ASSIGNEE_NOT_FOUND:
      '選択した担当者が見つかりません。',
    ASSIGNEE_INACTIVE:
      '無効なメンバーにはシフトを割り当てられません。',
    SHIFT_PRESET_NOT_FOUND:
      '選択したシフト枠が見つかりません。',
  }

  return messages[code] ??
    fallbackMessage
}

export function EditShiftForm({
  scheduleDate,
  shift,
  presets,
  onCancel,
  onUpdated,
}: EditShiftFormProps) {
  const [input, setInput] =
    useState<EditShiftFormInput>(
      () => getInitialInput(shift),
    )

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState<EditShiftFieldErrors>(
      {},
    )

  const {
    data: members = [],
    error: membersError,
    isError: isMembersError,
    isPending: isMembersPending,
  } = useMembers()

  const updateShiftMutation =
    useUpdateShift()

  const activeMembers =
    members.filter(
      (member) =>
        member.status === 'ACTIVE',
    )

  const apiError =
    updateShiftMutation.isError
      ? toApiError(
          updateShiftMutation.error,
        )
      : null

  function clearError(
    field: keyof EditShiftFieldErrors,
  ) {
    setFieldErrors((current) => ({
      ...current,
      form: undefined,
      [field]: undefined,
    }))

    updateShiftMutation.reset()
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    updateShiftMutation.reset()

    const prepared =
      prepareUpdateShiftInput(
        scheduleDate,
        shift,
        input,
      )

    if (!prepared.success) {
      setFieldErrors(prepared.errors)
      return
    }

    setFieldErrors({})

    updateShiftMutation.mutate(
      {
        shiftId: shift.id,
        body: prepared.body,
      },
      {
        onSuccess: (result) => {
          onUpdated(result)
        },
      },
    )
  }

  const isSubmitting =
    updateShiftMutation.isPending

  const currentPresetMissing =
    Boolean(shift.shiftPreset) &&
    !presets.some(
      (preset) =>
        preset.id ===
        shift.shiftPreset?.id,
    )

  return (
    <section className="mt-8 rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-indigo-600">
            EDIT SHIFT
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            シフトを編集
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            対象日：{scheduleDate}
          </p>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          閉じる
        </button>
      </div>

      {fieldErrors.form && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
        >
          {fieldErrors.form}
        </p>
      )}

      {apiError && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
        >
          {getApiErrorMessage(
            apiError.code,
            apiError.message,
          )}
        </p>
      )}

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-8"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="edit-shift-assignee"
              className="text-sm font-semibold text-slate-700"
            >
              担当者
            </label>

            {isMembersPending ? (
              <p className="mt-3 text-sm text-slate-500">
                メンバーを読み込んでいます...
              </p>
            ) : isMembersError ? (
              <p
                role="alert"
                className="mt-3 text-sm text-red-600"
              >
                {
                  toApiError(
                    membersError,
                  ).message
                }
              </p>
            ) : (
              <select
                id="edit-shift-assignee"
                value={
                  input.assigneeMembershipId
                }
                onChange={(event) => {
                  setInput((current) => ({
                    ...current,
                    assigneeMembershipId:
                      event.target.value,
                  }))
                  clearError(
                    'assigneeMembershipId',
                  )
                }}
                aria-invalid={Boolean(
                  fieldErrors
                    .assigneeMembershipId,
                )}
                className={inputClassName}
              >
                <option value="">
                  担当者を選択
                </option>

                {activeMembers.map(
                  (member) => (
                    <option
                      key={member.id}
                      value={member.id}
                    >
                      {member.name}
                      {' · '}
                      ID: {member.loginId}
                    </option>
                  ),
                )}
              </select>
            )}

            {fieldErrors
              .assigneeMembershipId && (
              <p className="mt-2 text-sm text-red-600">
                {
                  fieldErrors
                    .assigneeMembershipId
                }
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="edit-shift-preset"
              className="text-sm font-semibold text-slate-700"
            >
              シフト枠
            </label>

            <select
              id="edit-shift-preset"
              value={input.shiftPresetId}
              onChange={(event) => {
                const shiftPresetId =
                  event.target.value

                const selectedPreset =
                  presets.find(
                    (preset) =>
                      preset.id ===
                      shiftPresetId,
                  )

                setInput((current) => ({
                  ...current,
                  shiftPresetId,

                  ...(selectedPreset
                    ? {
                        startTime:
                          formatMinuteOfDay(
                            selectedPreset
                              .startMinute,
                          ),
                        endTime:
                          formatMinuteOfDay(
                            selectedPreset
                              .endMinute,
                          ),
                      }
                    : {}),
                }))

                clearError('startTime')
                clearError('endTime')
              }}
              className={inputClassName}
            >
              <option value="">
                カスタム（シフト枠なし）
              </option>

              {currentPresetMissing &&
                shift.shiftPreset && (
                  <option
                    value={
                      shift.shiftPreset.id
                    }
                  >
                    {shift.shiftPreset.name}
                  </option>
                )}

              {presets.map((preset) => (
                <option
                  key={preset.id}
                  value={preset.id}
                >
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-shift-start-time"
              className="text-sm font-semibold text-slate-700"
            >
              開始時刻
            </label>

            <input
              id="edit-shift-start-time"
              type="time"
              step={1800}
              value={input.startTime}
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  startTime:
                    event.target.value,
                }))
                clearError('startTime')
              }}
              aria-invalid={Boolean(
                fieldErrors.startTime,
              )}
              className={inputClassName}
            />

            {fieldErrors.startTime && (
              <p className="mt-2 text-sm text-red-600">
                {fieldErrors.startTime}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-shift-end-time"
              className="text-sm font-semibold text-slate-700"
            >
              終了時刻
            </label>

            <input
              id="edit-shift-end-time"
              type="time"
              step={1800}
              value={input.endTime}
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  endTime:
                    event.target.value,
                }))
                clearError('endTime')
              }}
              aria-invalid={Boolean(
                fieldErrors.endTime,
              )}
              className={inputClassName}
            />

            {fieldErrors.endTime && (
              <p className="mt-2 text-sm text-red-600">
                {fieldErrors.endTime}
              </p>
            )}

            <p className="mt-2 text-xs text-slate-500">
              終了時刻が開始時刻より早い場合は、翌日として扱います。
            </p>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="edit-shift-note"
              className="text-sm font-semibold text-slate-700"
            >
              メモ（任意）
            </label>

            <textarea
              id="edit-shift-note"
              rows={3}
              maxLength={500}
              value={input.note}
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  note: event.target.value,
                }))
                clearError('note')
              }}
              aria-invalid={Boolean(
                fieldErrors.note,
              )}
              className={inputClassName}
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
              <span>
                {fieldErrors.note ?? ''}
              </span>

              <span>
                {input.note.length}/500
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            キャンセル
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isMembersPending ||
              isMembersError
            }
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isSubmitting
              ? '更新中...'
              : '変更を保存'}
          </button>
        </div>
      </form>
    </section>
  )
}