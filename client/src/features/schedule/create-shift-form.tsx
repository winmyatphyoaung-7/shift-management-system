import {
  useState,
  type FormEvent,
} from 'react'

import { useMembers } from '../members/member-hooks.ts'
import { toApiError } from '../../lib/api-error.ts'
import {
  formatMinuteOfDay,
  prepareCreateShiftsInput,
  type CreateShiftFieldErrors,
  type CreateShiftFormInput,
} from './create-shift-validation.ts'
import { useCreateShifts } from './schedule-hooks.ts'
import type {
  CreateShiftsResult,
  ScheduleCoveragePreset,
} from './schedule-types.ts'

type CreateShiftFormProps = {
  scheduleDate: string
  presets: ScheduleCoveragePreset[]
  onCancel: () => void
  onCreated: (
    result: CreateShiftsResult,
  ) => void
}

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

function getInitialInput(
  presets: ScheduleCoveragePreset[],
): CreateShiftFormInput {
  const firstPreset = presets[0]

  return {
    shiftPresetId:
      firstPreset?.id ?? '',
    assigneeMembershipIds: [],
    startTime: firstPreset
      ? formatMinuteOfDay(
          firstPreset.startMinute,
        )
      : '08:00',
    endTime: firstPreset
      ? formatMinuteOfDay(
          firstPreset.endMinute,
        )
      : '13:00',
    note: '',
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
    SHIFT_OVERLAP:
      '選択した担当者に重複するシフトがあります。',
    SHIFT_ALREADY_STARTED:
      '開始済みの時刻にはシフトを作成できません。',
    SHIFT_DATE_MISMATCH:
      '開始時刻が選択した日付と一致しません。',
    INVALID_TIME_INCREMENT:
      'シフト時刻は30分単位で入力してください。',
    ASSIGNEE_INACTIVE:
      '無効なメンバーにはシフトを割り当てられません。',
    ASSIGNEE_NOT_FOUND:
      '選択した担当者が見つかりません。',
    SHIFT_PRESET_NOT_FOUND:
      '選択したシフト枠が見つかりません。',
    SHIFT_PRESETS_NOT_CONFIGURED:
      '有効なシフト枠が設定されていません。',
    SCHEDULE_DAY_ALREADY_PUBLISHED:
      '公開済みの日付にはDraftシフトを追加できません。',
  }

  return messages[code] ??
    fallbackMessage
}

export function CreateShiftForm({
  scheduleDate,
  presets,
  onCancel,
  onCreated,
}: CreateShiftFormProps) {
  const [input, setInput] =
    useState<CreateShiftFormInput>(
      () => getInitialInput(presets),
    )

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState<CreateShiftFieldErrors>(
      {},
    )

  const {
    data: members = [],
    error: membersError,
    isError: isMembersError,
    isPending: isMembersPending,
  } = useMembers()

  const createShiftsMutation =
    useCreateShifts()

  const activeMembers =
    members.filter(
      (member) =>
        member.status === 'ACTIVE',
    )

  const apiError =
    createShiftsMutation.isError
      ? toApiError(
          createShiftsMutation.error,
        )
      : null

  function toggleAssignee(
    membershipId: string,
  ) {
    setInput((current) => {
      const isSelected =
        current.assigneeMembershipIds
          .includes(membershipId)

      return {
        ...current,
        assigneeMembershipIds:
          isSelected
            ? current
                .assigneeMembershipIds
                .filter(
                  (id) =>
                    id !== membershipId,
                )
            : [
                ...current
                  .assigneeMembershipIds,
                membershipId,
              ],
      }
    })

    setFieldErrors((current) => ({
      ...current,
      assigneeMembershipIds:
        undefined,
    }))

    createShiftsMutation.reset()
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    createShiftsMutation.reset()

    const prepared =
      prepareCreateShiftsInput(
        scheduleDate,
        input,
      )

    if (!prepared.success) {
      setFieldErrors(prepared.errors)
      return
    }

    setFieldErrors({})

    createShiftsMutation.mutate(
      prepared.body,
      {
        onSuccess: (result) => {
          onCreated(result)
        },
      },
    )
  }

  const isSubmitting =
    createShiftsMutation.isPending

  return (
    <section className="mt-8 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-600">
            CREATE SHIFT
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Draftシフトを追加
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
              htmlFor="create-shift-preset"
              className="text-sm font-semibold text-slate-700"
            >
              シフト枠
            </label>

            <select
              id="create-shift-preset"
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

                createShiftsMutation.reset()
              }}
              className={inputClassName}
            >
              <option value="">
                カスタム（シフト枠なし）
              </option>

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
              htmlFor="create-shift-start-time"
              className="text-sm font-semibold text-slate-700"
            >
              開始時刻
            </label>

            <input
              id="create-shift-start-time"
              type="time"
              step={1800}
              value={input.startTime}
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  startTime:
                    event.target.value,
                }))
                setFieldErrors(
                  (current) => ({
                    ...current,
                    startTime:
                      undefined,
                  }),
                )
                createShiftsMutation.reset()
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
              htmlFor="create-shift-end-time"
              className="text-sm font-semibold text-slate-700"
            >
              終了時刻
            </label>

            <input
              id="create-shift-end-time"
              type="time"
              step={1800}
              value={input.endTime}
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  endTime:
                    event.target.value,
                }))
                setFieldErrors(
                  (current) => ({
                    ...current,
                    endTime:
                      undefined,
                  }),
                )
                createShiftsMutation.reset()
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
            <p className="text-sm font-semibold text-slate-700">
              担当者
            </p>

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
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeMembers.map(
                  (member) => {
                    const isSelected =
                      input
                        .assigneeMembershipIds
                        .includes(member.id)

                    return (
                      <label
                        key={member.id}
                        className={[
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
                          isSelected
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            toggleAssignee(
                              member.id,
                            )
                          }}
                          className="mt-1 size-4 accent-blue-600"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-950">
                            {member.name}
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            ID: {member.loginId}
                            {' · '}
                            {member.role ===
                            'MANAGER'
                              ? 'Manager'
                              : 'Staff'}
                          </span>
                        </span>
                      </label>
                    )
                  },
                )}
              </div>
            )}

            {fieldErrors
              .assigneeMembershipIds && (
              <p className="mt-2 text-sm text-red-600">
                {
                  fieldErrors
                    .assigneeMembershipIds
                }
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="create-shift-note"
              className="text-sm font-semibold text-slate-700"
            >
              メモ（任意）
            </label>

            <textarea
              id="create-shift-note"
              rows={3}
              maxLength={500}
              value={input.note}
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  note: event.target.value,
                }))
                setFieldErrors(
                  (current) => ({
                    ...current,
                    note: undefined,
                  }),
                )
                createShiftsMutation.reset()
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
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting
              ? '作成中...'
              : 'Draftシフトを作成'}
          </button>
        </div>
      </form>
    </section>
  )
}