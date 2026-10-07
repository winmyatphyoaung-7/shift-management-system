import {
  useState,
  type FormEvent,
} from 'react'

import { toApiError } from '../../lib/api-error.ts'
import {
  useClearDraftRange,
} from './schedule-hooks.ts'
import type {
  ClearDraftRangeCompletedResult,
  ClearDraftRangePreview,
  ScheduleDateRange,
} from './schedule-types.ts'

type ClearDraftRangeFormProps = {
  initialRange: ScheduleDateRange
  onCancel: () => void
  onCleared: (
    result: ClearDraftRangeCompletedResult,
  ) => void
}

type ClearDraftRangeFieldErrors = {
  from?: string
  to?: string
}

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

function getApiErrorMessage(
  code: string,
  fallbackMessage: string,
): string {
  const messages: Record<
    string,
    string
  > = {
    PUBLISHED_SCHEDULE_IN_RANGE:
      '選択した期間には公開済みのスケジュールが含まれているため、削除できません。',
    DRAFT_RANGE_CONTAINS_STARTED_SHIFT:
      '選択した期間には開始済みのシフトが含まれているため、削除できません。',
    VALIDATION_ERROR:
      '削除する期間を確認してください。',
  }

  return messages[code] ??
    fallbackMessage
}

export function ClearDraftRangeForm({
  initialRange,
  onCancel,
  onCleared,
}: ClearDraftRangeFormProps) {
  const [input, setInput] =
    useState<ScheduleDateRange>(
      initialRange,
    )

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState<ClearDraftRangeFieldErrors>(
      {},
    )

  const [
    preview,
    setPreview,
  ] =
    useState<ClearDraftRangePreview | null>(
      null,
    )

  const clearMutation =
    useClearDraftRange()

  const apiError =
    clearMutation.isError
      ? toApiError(
          clearMutation.error,
        )
      : null

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    clearMutation.reset()

    const errors:
      ClearDraftRangeFieldErrors = {}

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

    clearMutation.mutate(
      {
        ...input,
        confirmed:
          preview !== null,
      },
      {
        onSuccess: (result) => {
          if (result.cleared) {
            onCleared(result)
            return
          }

          setPreview(result.preview)
        },
      },
    )
  }

  function handleResetPreview() {
    setPreview(null)
    clearMutation.reset()
  }

  const isSubmitting =
    clearMutation.isPending

  const hasNoDeletionTargets =
    preview !== null &&
    preview.scheduleDayCount === 0

  return (
    <section className="mt-8 rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-red-600">
            CLEAR DRAFT RANGE
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Draft期間を削除
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            選択した期間のDraftスケジュールをまとめて削除します。
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

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
        <p className="font-semibold">
          この操作は元に戻せません
        </p>

        <p className="mt-1">
          対象となるSchedule Day、シフト、人員要件が完全に削除されます。公開済みの日付や開始済みのシフトを含む期間は削除できません。
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
              htmlFor="clear-draft-from"
              className="text-sm font-semibold text-slate-700"
            >
              開始日
            </label>

            <input
              id="clear-draft-from"
              type="date"
              value={input.from}
              disabled={
                isSubmitting ||
                preview !== null
              }
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  from: event.target.value,
                }))

                setFieldErrors({})
                setPreview(null)
                clearMutation.reset()
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
              htmlFor="clear-draft-to"
              className="text-sm font-semibold text-slate-700"
            >
              終了日
            </label>

            <input
              id="clear-draft-to"
              type="date"
              value={input.to}
              disabled={
                isSubmitting ||
                preview !== null
              }
              onChange={(event) => {
                setInput((current) => ({
                  ...current,
                  to: event.target.value,
                }))

                setFieldErrors({})
                setPreview(null)
                clearMutation.reset()
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

        {preview && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
            <h3 className="text-lg font-bold text-slate-950">
              削除内容の確認
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              {preview.range.from}
              {' ～ '}
              {preview.range.to}
            </p>

            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Schedule Day
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {preview.scheduleDayCount}
                  件
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  シフト
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {preview.shiftCount}
                  件
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  人員要件
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {
                    preview
                      .coverageRequirementCount
                  }
                  件
                </dd>
              </div>
            </dl>

            {hasNoDeletionTargets ? (
              <p className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                選択した期間に削除対象のDraftスケジュールはありません。
              </p>
            ) : (
              <p className="mt-5 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700">
                上記のデータを完全に削除します。削除後は元に戻せません。
              </p>
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
            disabled={
              isSubmitting ||
              hasNoDeletionTargets
            }
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isSubmitting
              ? preview
                ? '削除中...'
                : '確認中...'
              : hasNoDeletionTargets
                ? '削除対象がありません'
                : preview
                  ? '完全に削除する'
                  : '削除内容を確認する'}
          </button>
        </div>
      </form>
    </section>
  )
}