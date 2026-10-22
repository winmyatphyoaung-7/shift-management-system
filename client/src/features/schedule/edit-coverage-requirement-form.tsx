import {
    useState,
    type FormEvent,
} from 'react'

import { toApiError } from '../../lib/api-error.ts'
import {
    useUpdateCoverageRequirement,
} from './schedule-hooks.ts'
import type {
    CoverageRequirement,
} from './schedule-types.ts'

type EditCoverageRequirementFormProps = {
    requirement: CoverageRequirement
    onClose: () => void
    onUpdated: (
        warningCount: number,
    ) => void
}

const timeFormatter =
    new Intl.DateTimeFormat('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })

function formatTime(
    value: string,
): string {
    return timeFormatter.format(
        new Date(value),
    )
}

function getApiErrorMessage(
    code: string,
    fallbackMessage: string,
): string {
    const messages: Record<
        string,
        string
    > = {
        COVERAGE_REQUIREMENT_NOT_FOUND:
            '人員要件が見つかりません。',
        COVERAGE_REQUIREMENT_ALREADY_STARTED:
            '開始済みの時間帯は変更できません。',
    }

    return (
        messages[code] ??
        fallbackMessage
    )
}

export function EditCoverageRequirementForm({
    requirement,
    onClose,
    onUpdated,
}: EditCoverageRequirementFormProps) {
    const [
        requiredCount,
        setRequiredCount,
    ] = useState(
        String(
            requirement.requiredCount,
        ),
    )

    const [
        fieldError,
        setFieldError,
    ] = useState<string | null>(null)

    const updateMutation =
        useUpdateCoverageRequirement()

    const apiError =
        updateMutation.isError
            ? toApiError(
                  updateMutation.error,
              )
            : null

    const isSubmitting =
        updateMutation.isPending

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        updateMutation.reset()
        setFieldError(null)

        const parsedCount =
            Number(requiredCount)

        if (
            !Number.isInteger(
                parsedCount,
            ) ||
            parsedCount < 1 ||
            parsedCount > 100
        ) {
            setFieldError(
                '必要人数は1〜100の整数で入力してください。',
            )
            return
        }

        updateMutation.mutate(
            {
                coverageRequirementId:
                    requirement.id,
                requiredCount:
                    parsedCount,
            },
            {
                onSuccess: (result) => {
                    onUpdated(
                        result.warnings.length,
                    )
                },
            },
        )
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="coverage-requirement-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
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
            <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
                <p className="text-sm font-semibold tracking-wide text-blue-600">
                    STAFFING REQUIREMENT
                </p>

                <h2
                    id="coverage-requirement-title"
                    className="mt-2 text-2xl font-bold text-slate-950"
                >
                    必要人数を変更
                </h2>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">
                        {
                            requirement
                                .shiftPreset
                                .name
                        }
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                        {formatTime(
                            requirement.startAt,
                        )}
                        {' ～ '}
                        {formatTime(
                            requirement.endAt,
                        )}
                    </p>
                </div>

                {apiError && (
                    <p
                        role="alert"
                        className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
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
                    <label
                        htmlFor="required-count"
                        className="text-sm font-semibold text-slate-700"
                    >
                        必要人数
                    </label>

                    <input
                        id="required-count"
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        value={requiredCount}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setRequiredCount(
                                event.target.value,
                            )
                            setFieldError(null)
                            updateMutation.reset()
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                    />

                    {fieldError && (
                        <p
                            role="alert"
                            className="mt-2 text-sm text-red-600"
                        >
                            {fieldError}
                        </p>
                    )}

                    <div className="mt-8 flex justify-end gap-3">
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
                                : '更新する'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}