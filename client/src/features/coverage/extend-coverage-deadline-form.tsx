import {
  useState,
  type FormEvent,
} from 'react'

import { toApiError } from '../../lib/api-error.ts'
import {
  useExtendCoverageRequestDeadline,
} from './coverage-hooks.ts'
import type {
  ManagerCoverageRequest,
} from './coverage-types.ts'

type ExtendCoverageDeadlineFormProps = {
  request: ManagerCoverageRequest
  onClose: () => void
  onExtended: (
    responseDeadline: string,
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
    COVERAGE_REQUEST_NOT_FOUND:
      '交代依頼が見つかりません。',
    COVERAGE_REQUEST_NOT_OPEN:
      '募集中の交代依頼のみ回答期限を延長できます。',
    SHIFT_NOT_ACTIVE:
      '対象のシフトは有効ではありません。',
    SHIFT_ALREADY_STARTED:
      '開始済みのシフトでは回答期限を延長できません。',
    RESPONSE_DEADLINE_NOT_FUTURE:
      '新しい回答期限は現在より後の時刻を指定してください。',
    RESPONSE_DEADLINE_NOT_BEFORE_SHIFT:
      '新しい回答期限はシフト開始時刻より前にしてください。',
    RESPONSE_DEADLINE_NOT_EXTENDED:
      '新しい回答期限は現在の回答期限より後にしてください。',
    COVERAGE_REQUEST_STATE_CHANGED:
      '交代依頼の状態が変更されました。画面を更新して確認してください。',
  }

  return (
    messages[code] ??
    fallbackMessage
  )
}

export function ExtendCoverageDeadlineForm({
  request,
  onClose,
  onExtended,
}: ExtendCoverageDeadlineFormProps) {
  const [
    responseDeadline,
    setResponseDeadline,
  ] = useState('')

  const [
    fieldError,
    setFieldError,
  ] = useState<string | null>(null)

  const extendMutation =
    useExtendCoverageRequestDeadline()

  const apiError =
    extendMutation.isError
      ? toApiError(
          extendMutation.error,
        )
      : null

  const isSubmitting =
    extendMutation.isPending

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    extendMutation.reset()
    setFieldError(null)

    if (!responseDeadline) {
      setFieldError(
        '新しい回答期限を入力してください。',
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
        '新しい回答期限は現在より後の時刻を指定してください。',
      )
      return
    }

    if (
      request.responseDeadline &&
      deadline.getTime() <=
        new Date(
          request.responseDeadline,
        ).getTime()
    ) {
      setFieldError(
        '新しい回答期限は現在の回答期限より後にしてください。',
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
        '新しい回答期限はシフト開始時刻より前にしてください。',
      )
      return
    }

    extendMutation.mutate(
      {
        coverageRequestId:
          request.id,
        responseDeadline:
          deadline.toISOString(),
      },
      {
        onSuccess: (result) => {
          onExtended(
            result.responseDeadline,
          )
        },
      },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !isSubmitting
        ) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="extend-deadline-title"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <p className="text-sm font-semibold tracking-wide text-blue-600">
          EXTEND DEADLINE
        </p>

        <h2
          id="extend-deadline-title"
          className="mt-2 text-2xl font-bold text-slate-950"
        >
          回答期限を延長
        </h2>

        <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm">
          <p className="font-semibold text-slate-500">
            現在の回答期限
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {request.responseDeadline
              ? formatDateTime(
                  request.responseDeadline,
                )
              : '未設定'}
          </p>

          <p className="mt-4 font-semibold text-slate-500">
            シフト開始時刻
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {formatDateTime(
              request.requestedStartAt,
            )}
          </p>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-6"
        >
          <label
            htmlFor="extended-response-deadline"
            className="text-sm font-semibold text-slate-700"
          >
            新しい回答期限
          </label>

          <input
            id="extended-response-deadline"
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
              extendMutation.reset()
            }}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          />

          {fieldError && (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-red-600"
            >
              {fieldError}
            </p>
          )}

          {apiError && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {getApiErrorMessage(
                apiError.code,
                apiError.message,
              )}
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              戻る
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting
                ? '更新中...'
                : '回答期限を延長'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}