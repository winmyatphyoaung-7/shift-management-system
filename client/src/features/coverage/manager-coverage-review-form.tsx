import {
  useState,
  type FormEvent,
} from 'react'

import {
  useApproveAndOpenCoverageRequest,
  useRejectCoverageRequest,
} from './coverage-hooks.ts'
import type {
  ManagerCoverageRequest,
} from './coverage-types.ts'
import { toApiError } from '../../lib/api-error.ts'

type ReviewAction =
  | 'APPROVE'
  | 'REJECT'

type ManagerCoverageReviewFormProps = {
  request: ManagerCoverageRequest
  action: ReviewAction
  onClose: () => void
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
    COVERAGE_REQUEST_NOT_FOUND:
      '交代依頼が見つかりません。',
    COVERAGE_REQUEST_NOT_PENDING:
      'この依頼はすでに確認済みです。',
    COVERAGE_REQUEST_STATE_CHANGED:
      '依頼の状態が変更されました。画面を更新して確認してください。',
    SHIFT_NOT_ACTIVE:
      '対象のシフトは有効ではありません。',
    SHIFT_ALREADY_STARTED:
      '開始済みのシフトは処理できません。',
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

export function ManagerCoverageReviewForm({
  request,
  action,
  onClose,
}: ManagerCoverageReviewFormProps) {
  const [
    responseDeadline,
    setResponseDeadline,
  ] = useState('')

  const [
    rejectionNote,
    setRejectionNote,
  ] = useState('')

  const [
    fieldError,
    setFieldError,
  ] = useState<string | null>(null)

  const approveMutation =
    useApproveAndOpenCoverageRequest()

  const rejectMutation =
    useRejectCoverageRequest()

  const activeMutation =
    action === 'APPROVE'
      ? approveMutation
      : rejectMutation

  const apiError =
    activeMutation.isError
      ? toApiError(
          activeMutation.error,
        )
      : null

  const isSubmitting =
    approveMutation.isPending ||
    rejectMutation.isPending

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    approveMutation.reset()
    rejectMutation.reset()
    setFieldError(null)

    if (action === 'APPROVE') {
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
          request.requestedStartAt,
        ).getTime()
      ) {
        setFieldError(
          '回答期限はシフト開始時刻より前にしてください。',
        )
        return
      }

      approveMutation.mutate(
        {
          coverageRequestId:
            request.id,
          responseDeadline:
            deadline.toISOString(),
        },
        {
          onSuccess: onClose,
        },
      )

      return
    }

    const trimmedNote =
      rejectionNote.trim()

    if (trimmedNote.length > 500) {
      setFieldError(
        '却下理由は500文字以内で入力してください。',
      )
      return
    }

    rejectMutation.mutate(
      {
        coverageRequestId:
          request.id,
        ...(trimmedNote
          ? {
              rejectionNote:
                trimmedNote,
            }
          : {}),
      },
      {
        onSuccess: onClose,
      },
    )
  }

  const isApprove =
    action === 'APPROVE'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coverage-review-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div>
          <p
            className={[
              'text-sm font-semibold tracking-wide',
              isApprove
                ? 'text-blue-600'
                : 'text-red-600',
            ].join(' ')}
          >
            {isApprove
              ? 'APPROVE REQUEST'
              : 'REJECT REQUEST'}
          </p>

          <h2
            id="coverage-review-title"
            className="mt-2 text-2xl font-bold text-slate-950"
          >
            {isApprove
              ? '依頼を承認して募集開始'
              : '交代依頼を却下'}
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {
              request
                .originalAssignee
                .user.name
            }
            さんのシフト
            <br />
            {formatDateTime(
              request.requestedStartAt,
            )}
            {' 〜 '}
            {formatDateTime(
              request.requestedEndAt,
            )}
          </p>
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
          className="mt-6"
        >
          {isApprove ? (
            <div>
              <label
                htmlFor="coverage-response-deadline"
                className="text-sm font-semibold text-slate-700"
              >
                回答期限
              </label>

              <input
                id="coverage-response-deadline"
                type="datetime-local"
                value={responseDeadline}
                max={toDateTimeLocal(
                  request.requestedStartAt,
                )}
                disabled={isSubmitting}
                onChange={(event) => {
                  setResponseDeadline(
                    event.target.value,
                  )
                  setFieldError(null)
                  approveMutation.reset()
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                シフト開始時刻より前の日時を指定してください。
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="coverage-rejection-note"
                className="text-sm font-semibold text-slate-700"
              >
                却下理由（任意）
              </label>

              <textarea
                id="coverage-rejection-note"
                value={rejectionNote}
                maxLength={500}
                rows={5}
                disabled={isSubmitting}
                onChange={(event) => {
                  setRejectionNote(
                    event.target.value,
                  )
                  setFieldError(null)
                  rejectMutation.reset()
                }}
                placeholder="スタッフに伝える理由を入力してください"
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
              />

              <p className="mt-2 text-right text-xs text-slate-500">
                {rejectionNote.length}
                /500
              </p>
            </div>
          )}

          {fieldError && (
            <p
              role="alert"
              className="mt-4 text-sm font-medium text-red-600"
            >
              {fieldError}
            </p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              戻る
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={[
                'rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed',
                isApprove
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300',
              ].join(' ')}
            >
              {isSubmitting
                ? '処理中...'
                : isApprove
                  ? '承認して募集開始'
                  : '依頼を却下'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}