import {
  useState,
  type FormEvent,
} from 'react'

import type {
  ScheduleShift,
} from '../schedule/schedule-types.ts'
import { toApiError } from '../../lib/api-error.ts'
import { useCreateManagerCoverageRequest } from './coverage-hooks.ts'
import type {
  CoverageReasonCategory,
  CreatedManagerCoverageRequest,
} from './coverage-types.ts'

type ReasonValue =
  | CoverageReasonCategory
  | ''

type ManagerCoverageRequestFormProps = {
  shift: ScheduleShift
  onCancel: () => void
  onCreated: (
    request: CreatedManagerCoverageRequest,
  ) => void
}

function formatDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'ja-JP',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  ).format(new Date(value))
}

function toDateTimeLocal(
  value: string,
): string {
  const date = new Date(value)

  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    date.getDate(),
  ).padStart(2, '0')
  const hour = String(
    date.getHours(),
  ).padStart(2, '0')
  const minute = String(
    date.getMinutes(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:${minute}`
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
      '対象のシフトは有効ではありません。',
    SHIFT_NOT_PUBLISHED:
      '公開済みのシフトのみ交代募集を作成できます。',
    SHIFT_ALREADY_STARTED:
      '開始済みのシフトには交代募集を作成できません。',
    COVERAGE_REQUEST_ALREADY_ACTIVE:
      'このシフトにはすでに有効な交代依頼があります。',
    RESPONSE_DEADLINE_NOT_FUTURE:
      '回答期限は現在より後の時刻を指定してください。',
    RESPONSE_DEADLINE_TOO_LATE:
      '回答期限はシフト開始時刻より前にしてください。',
  }

  return (
    messages[code] ??
    fallbackMessage
  )
}

export function ManagerCoverageRequestForm({
  shift,
  onCancel,
  onCreated,
}: ManagerCoverageRequestFormProps) {
  const [
    reasonCategory,
    setReasonCategory,
  ] = useState<ReasonValue>('')

  const [
    reasonDetails,
    setReasonDetails,
  ] = useState('')

  const [
    responseDeadline,
    setResponseDeadline,
  ] = useState('')

  const [
    fieldError,
    setFieldError,
  ] = useState<string | null>(null)

  const createMutation =
    useCreateManagerCoverageRequest()

  const apiError =
    createMutation.isError
      ? toApiError(
          createMutation.error,
        )
      : null

  function resetError() {
    setFieldError(null)
    createMutation.reset()
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    resetError()

    if (!reasonCategory) {
      setFieldError(
        '理由を選択してください。',
      )
      return
    }

    const trimmedDetails =
      reasonDetails.trim()

    if (trimmedDetails.length > 1000) {
      setFieldError(
        '詳細は1000文字以内で入力してください。',
      )
      return
    }

    if (!responseDeadline) {
      setFieldError(
        '回答期限を入力してください。',
      )
      return
    }

    const deadline =
      new Date(responseDeadline)

    if (
      Number.isNaN(
        deadline.getTime(),
      )
    ) {
      setFieldError(
        '有効な回答期限を入力してください。',
      )
      return
    }

    if (
      deadline.getTime() <=
      Date.now()
    ) {
      setFieldError(
        '回答期限は現在より後の時刻を指定してください。',
      )
      return
    }

    if (
      deadline.getTime() >=
      new Date(
        shift.startAt,
      ).getTime()
    ) {
      setFieldError(
        '回答期限はシフト開始時刻より前にしてください。',
      )
      return
    }

    createMutation.mutate(
      {
        shiftId: shift.id,
        reasonCategory,
        ...(trimmedDetails
          ? {
              reasonDetails:
                trimmedDetails,
            }
          : {}),
        responseDeadline:
          deadline.toISOString(),
      },
      {
        onSuccess: onCreated,
      },
    )
  }

  return (
    <section className="mt-8 rounded-3xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-violet-600">
            URGENT REPLACEMENT
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            マネージャーから交代募集を作成
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {shift.assignee.user.name}
            さんのシフト
            <br />
            {formatDateTime(
              shift.startAt,
            )}
            {' 〜 '}
            {formatDateTime(
              shift.endAt,
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={
            createMutation.isPending
          }
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          閉じる
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm leading-6 text-violet-700">
        作成すると、確認待ちにはならず、すぐに交代募集が開始されます。
      </div>

      {apiError && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
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
        className="mt-7"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="manager-coverage-reason"
              className="text-sm font-semibold text-slate-700"
            >
              理由
            </label>

            <select
              id="manager-coverage-reason"
              value={reasonCategory}
              disabled={
                createMutation.isPending
              }
              onChange={(event) => {
                setReasonCategory(
                  event.target
                    .value as ReasonValue,
                )
                resetError()
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            >
              <option value="">
                選択してください
              </option>
              <option value="HEALTH">
                体調・通院
              </option>
              <option value="SCHOOL">
                学校・授業
              </option>
              <option value="PERSONAL">
                個人的な事情
              </option>
              <option value="OTHER">
                その他
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="manager-coverage-deadline"
              className="text-sm font-semibold text-slate-700"
            >
              回答期限
            </label>

            <input
              id="manager-coverage-deadline"
              type="datetime-local"
              value={responseDeadline}
              max={toDateTimeLocal(
                shift.startAt,
              )}
              disabled={
                createMutation.isPending
              }
              onChange={(event) => {
                setResponseDeadline(
                  event.target.value,
                )
                resetError()
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              シフト開始時刻より前の日時を指定してください。
            </p>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="manager-coverage-details"
              className="text-sm font-semibold text-slate-700"
            >
              詳細（任意）
            </label>

            <textarea
              id="manager-coverage-details"
              value={reasonDetails}
              maxLength={1000}
              rows={5}
              disabled={
                createMutation.isPending
              }
              onChange={(event) => {
                setReasonDetails(
                  event.target.value,
                )
                resetError()
              }}
              placeholder="スタッフへ共有する内容を入力してください"
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
            />

            <p className="mt-2 text-right text-xs text-slate-500">
              {reasonDetails.length}
              /1000
            </p>
          </div>
        </div>

        {fieldError && (
          <p
            role="alert"
            className="mt-5 text-sm font-medium text-red-600"
          >
            {fieldError}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={
              createMutation.isPending
            }
            onClick={onCancel}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            キャンセル
          </button>

          <button
            type="submit"
            disabled={
              createMutation.isPending
            }
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
          >
            {createMutation.isPending
              ? '作成中...'
              : '交代募集を開始'}
          </button>
        </div>
      </form>
    </section>
  )
}