import {
  useState,
  type FormEvent,
} from 'react'

import { toApiError } from '../../lib/api-error.ts'
import {
  addDays,
  parseDateKey,
} from './schedule-date.ts'
import {
  useCopyScheduleWeek,
} from './schedule-hooks.ts'
import type {
  CopyWeekCompletedResult,
  CopyWeekPreview,
} from './schedule-types.ts'

type CopyWeekFormProps = {
  initialSourceWeekStart: string
  onCancel: () => void
  onCopied: (
    result: CopyWeekCompletedResult,
  ) => void
}

type CopyWeekFieldErrors = {
  sourceWeekStart?: string
}

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

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
    TARGET_WEEK_NOT_EMPTY:
      'コピー先の週には、すでにスケジュールデータがあります。',
    TARGET_SHIFT_ALREADY_STARTED:
      'コピー先に開始済みとなるシフトが含まれています。',
    VALIDATION_ERROR:
      'コピー元の週を確認してください。',
  }

  return messages[code] ??
    fallbackMessage
}

export function CopyWeekForm({
  initialSourceWeekStart,
  onCancel,
  onCopied,
}: CopyWeekFormProps) {
  const [
    sourceWeekStart,
    setSourceWeekStart,
  ] = useState(
    initialSourceWeekStart,
  )

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState<CopyWeekFieldErrors>(
      {},
    )

  const [
    preview,
    setPreview,
  ] =
    useState<CopyWeekPreview | null>(
      null,
    )

  const copyWeekMutation =
    useCopyScheduleWeek()

  const targetWeekStart =
    sourceWeekStart
      ? addDays(sourceWeekStart, 7)
      : ''

  const apiError =
    copyWeekMutation.isError
      ? toApiError(
          copyWeekMutation.error,
        )
      : null

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    copyWeekMutation.reset()

    const errors:
      CopyWeekFieldErrors = {}

    if (!sourceWeekStart) {
      errors.sourceWeekStart =
        'コピー元の週を選択してください。'
    } else if (
      parseDateKey(
        sourceWeekStart,
      ).getDay() !== 1
    ) {
      errors.sourceWeekStart =
        '週の開始日は月曜日を選択してください。'
    }

    if (
      Object.keys(errors).length > 0
    ) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})

    copyWeekMutation.mutate(
      {
        sourceWeekStart,
        targetWeekStart,
        confirmed:
          preview !== null,
      },
      {
        onSuccess: (result) => {
          if (result.copied) {
            onCopied(result)
            return
          }

          setPreview(result.preview)
        },
      },
    )
  }

  function handleResetPreview() {
    setPreview(null)
    copyWeekMutation.reset()
  }

  const isSubmitting =
    copyWeekMutation.isPending

  return (
    <section className="mt-8 rounded-3xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-violet-600">
            COPY WEEK
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            翌週へシフトをコピー
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            選択した週のACTIVEシフトを翌週へコピーします。
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
          コピー前に確認してください
        </p>

        <p className="mt-1">
          コピー先の週は完全に空である必要があります。コピーを実行すると、翌週に7日分のDraftスケジュールが作成されます。
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
              htmlFor="copy-source-week"
              className="text-sm font-semibold text-slate-700"
            >
              コピー元の週（月曜日）
            </label>

            <input
              id="copy-source-week"
              type="date"
              value={sourceWeekStart}
              disabled={
                isSubmitting ||
                preview !== null
              }
              onChange={(event) => {
                setSourceWeekStart(
                  event.target.value,
                )

                setFieldErrors({})
                setPreview(null)
                copyWeekMutation.reset()
              }}
              aria-invalid={Boolean(
                fieldErrors.sourceWeekStart,
              )}
              className={inputClassName}
            />

            {fieldErrors.sourceWeekStart && (
              <p className="mt-2 text-sm text-red-600">
                {
                  fieldErrors
                    .sourceWeekStart
                }
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="copy-target-week"
              className="text-sm font-semibold text-slate-700"
            >
              コピー先の週（月曜日）
            </label>

            <input
              id="copy-target-week"
              type="date"
              value={targetWeekStart}
              readOnly
              aria-readonly="true"
              className={inputClassName}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              コピー元の翌週が自動的に選択されます。
            </p>
          </div>
        </div>

        {preview && (
          <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <h3 className="text-lg font-bold text-slate-950">
              コピー内容の確認
            </h3>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  コピー元
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {preview.sourceWeek.from}
                  {' ～ '}
                  {preview.sourceWeek.to}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  コピー先
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {preview.targetWeek.from}
                  {' ～ '}
                  {preview.targetWeek.to}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  コピー元シフト
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {preview.sourceShiftCount}
                  件
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  コピー可能
                </dt>
                <dd className="mt-1 text-sm font-semibold text-emerald-700">
                  {preview.copyableShiftCount}
                  件
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  スキップ
                </dt>
                <dd className="mt-1 text-sm font-semibold text-amber-700">
                  {preview.skippedShiftCount}
                  件
                </dd>
              </div>
            </dl>

            {preview.warnings.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold">
                  無効なスタッフに割り当てられたシフトはコピーされません。
                </p>

                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {preview.warnings.map(
                    (warning) => (
                      <li
                        key={
                          warning.shiftId
                        }
                      >
                        Membership ID:{' '}
                        {
                          warning.membershipId
                        }
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={
              preview
                ? handleResetPreview
                : onCancel
            }
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {preview
              ? '選択し直す'
              : 'キャンセル'}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
          >
            {isSubmitting
              ? preview
                ? 'コピー中...'
                : '確認中...'
              : preview
                ? 'この内容でコピーする'
                : 'コピー内容を確認する'}
          </button>
        </div>
      </form>
    </section>
  )
}