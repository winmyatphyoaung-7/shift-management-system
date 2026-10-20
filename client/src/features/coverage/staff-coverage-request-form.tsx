import {
  useState,
  type FormEvent,
} from 'react'

import {
  useCreateStaffCoverageRequest,
} from './coverage-hooks.ts'
import type {
  CoverageReasonCategory,
  CreatedStaffCoverageRequest,
} from './coverage-types.ts'
import type {
  ScheduleShift,
} from '../schedule/schedule-types.ts'
import { toApiError } from '../../lib/api-error.ts'

type StaffCoverageRequestFormProps = {
  shift: ScheduleShift
  onCancel: () => void
  onCreated: (
    request: CreatedStaffCoverageRequest,
  ) => void
}

const reasonOptions: Array<{
  value: CoverageReasonCategory
  label: string
}> = [
  {
    value: 'HEALTH',
    label: '体調・通院',
  },
  {
    value: 'SCHOOL',
    label: '学校・授業',
  },
  {
    value: 'PERSONAL',
    label: '個人的な事情',
  },
  {
    value: 'OTHER',
    label: 'その他',
  },
]

function formatShiftDateTime(
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

function getApiErrorMessage(
  code: string,
  fallbackMessage: string,
): string {
  const messages: Record<
    string,
    string
  > = {
    SHIFT_NOT_ASSIGNED_TO_MEMBER:
      '自分に割り当てられたシフトのみ申請できます。',
    SHIFT_NOT_ACTIVE:
      '有効なシフトではありません。',
    SHIFT_NOT_PUBLISHED:
      '公開済みのシフトのみ申請できます。',
    SHIFT_ALREADY_STARTED:
      '開始済みのシフトは申請できません。',
    STAFF_REQUEST_NOTICE_TOO_SHORT:
      'スタッフからの申請には7日以上の余裕が必要です。急な場合はマネージャーへ直接連絡してください。',
    COVERAGE_REQUEST_ALREADY_ACTIVE:
      'このシフトには進行中の交代依頼があります。',
  }

  return messages[code] ??
    fallbackMessage
}

export function StaffCoverageRequestForm({
  shift,
  onCancel,
  onCreated,
}: StaffCoverageRequestFormProps) {
  const [
    reasonCategory,
    setReasonCategory,
  ] =
    useState<CoverageReasonCategory>(
      'HEALTH',
    )

  const [
    reasonDetails,
    setReasonDetails,
  ] = useState('')

  const createMutation =
    useCreateStaffCoverageRequest()

  const apiError =
    createMutation.isError
      ? toApiError(
          createMutation.error,
        )
      : null

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    createMutation.reset()

    const trimmedDetails =
      reasonDetails.trim()

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
            REPLACEMENT REQUEST
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            シフト交代を申請
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {formatShiftDateTime(
              shift.startAt,
            )}
            {' ～ '}
            {formatShiftDateTime(
              shift.endAt,
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={createMutation.isPending}
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          閉じる
        </button>
      </div>

      <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
        スタッフからの申請は、
        シフト開始の7日前までに行ってください。
        急な欠勤の場合はマネージャーへ直接連絡してください。
      </p>

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
        onSubmit={handleSubmit}
        className="mt-6 space-y-6"
      >
        <div>
          <label
            htmlFor="coverage-reason-category"
            className="text-sm font-semibold text-slate-700"
          >
            理由
          </label>

          <select
            id="coverage-reason-category"
            value={reasonCategory}
            disabled={createMutation.isPending}
            onChange={(event) => {
              setReasonCategory(
                event.target.value as
                  CoverageReasonCategory,
              )
              createMutation.reset()
            }}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
          >
            {reasonOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="coverage-reason-details"
            className="text-sm font-semibold text-slate-700"
          >
            詳細（任意）
          </label>

          <textarea
            id="coverage-reason-details"
            rows={4}
            maxLength={1000}
            value={reasonDetails}
            disabled={createMutation.isPending}
            onChange={(event) => {
              setReasonDetails(
                event.target.value,
              )
              createMutation.reset()
            }}
            placeholder="マネージャーへ伝えたい内容を入力してください。"
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
          />

          <p className="mt-1 text-right text-xs text-slate-500">
            {reasonDetails.length}
            /1000
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            キャンセル
          </button>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
          >
            {createMutation.isPending
              ? '申請中...'
              : '交代を申請する'}
          </button>
        </div>
      </form>
    </section>
  )
}