import {
  useState,
  type FormEvent,
} from 'react'

import { toApiError } from '../../lib/api-error.ts'
import {
  usePublishSchedule,
} from './schedule-hooks.ts'
import type {
  PublishScheduleResult,
  ScheduleDateRange,
} from './schedule-types.ts'

type PublishScheduleFormProps = {
  initialRange: ScheduleDateRange
  onCancel: () => void
  onPublished: (
    result: PublishScheduleResult,
  ) => void
}

type PublishFieldErrors = {
  from?: string
  to?: string
}

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

function getApiErrorMessage(
  code: string,
  fallbackMessage: string,
): string {
  const messages: Record<
    string,
    string
  > = {
    STORE_NOT_FOUND:
      '店舗情報が見つかりません。',
    SCHEDULE_DAY_ALREADY_PUBLISHED:
      '選択した期間には、すでに公開済みの日付が含まれています。',
    VALIDATION_ERROR:
      '公開期間を確認してください。',
  }

  return messages[code] ??
    fallbackMessage
}

export function PublishScheduleForm({
  initialRange,
  onCancel,
  onPublished,
}: PublishScheduleFormProps) {
  const [input, setInput] =
    useState<ScheduleDateRange>(
      initialRange,
    )

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState<PublishFieldErrors>(
      {},
    )

  const publishMutation =
    usePublishSchedule()

  const apiError =
    publishMutation.isError
      ? toApiError(
          publishMutation.error,
        )
      : null

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    publishMutation.reset()

    const errors:
      PublishFieldErrors = {}

    if (!input.from) {
      errors.from =
        '開始日を選択してください。'
    }

    if (!input.to) {
      errors.to =
        '終了日を選択してください。'
    } else if (
      input.from &&
      input.to < input.from
    ) {
      errors.to =
        '終了日は開始日以降を選択してください。'
    }

    if (
      Object.keys(errors).length > 0
    ) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})

    publishMutation.mutate(
      input,
      {
        onSuccess: (result) => {
          onPublished(result)
        },
      },
    )
  }

  const isSubmitting =
    publishMutation.isPending

  return (
    <section className="mt-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-emerald-600">
            PUBLISH SCHEDULE
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            シフトを公開
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            公開後、スタッフが対象期間のシフトを確認できるようになります。
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

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
        <p className="font-semibold">
          公開前に確認してください
        </p>

        <p className="mt-1">
          シフトが登録されていない日も対象期間に含まれている場合、その日を公開済みとして作成します。現在、公開をDraftへ戻す機能はありません。
        </p>
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
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="publish-from"
              className="text-sm font-semibold text-slate-700"
            >
              開始日
            </label>

            <input
              id="publish-from"
              type="date"
              value={input.from}
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  from: event.target.value,
                }))

                setFieldErrors(
                  (current) => ({
                    ...current,
                    from: undefined,
                    to: undefined,
                  }),
                )

                publishMutation.reset()
              }}
              aria-invalid={Boolean(
                fieldErrors.from,
              )}
              className={inputClassName}
            />

            {fieldErrors.from && (
              <p className="mt-2 text-sm text-red-600">
                {fieldErrors.from}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="publish-to"
              className="text-sm font-semibold text-slate-700"
            >
              終了日
            </label>

            <input
              id="publish-to"
              type="date"
              value={input.to}
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  to: event.target.value,
                }))

                setFieldErrors(
                  (current) => ({
                    ...current,
                    to: undefined,
                  }),
                )

                publishMutation.reset()
              }}
              aria-invalid={Boolean(
                fieldErrors.to,
              )}
              className={inputClassName}
            />

            {fieldErrors.to && (
              <p className="mt-2 text-sm text-red-600">
                {fieldErrors.to}
              </p>
            )}
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
            disabled={isSubmitting}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isSubmitting
              ? '公開中...'
              : 'この期間を公開する'}
          </button>
        </div>
      </form>
    </section>
  )
}