import { toApiError } from '../../lib/api-error.ts'
import {
    useRemoveShift,
} from './schedule-hooks.ts'
import type {
    ScheduleDayStatus,
    ScheduleShift,
} from './schedule-types.ts'

type RemoveShiftConfirmationProps = {
    scheduleDate: string
    scheduleStatus: ScheduleDayStatus
    shift: ScheduleShift
    onCancel: () => void
    onRemoved: () => void
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
        SHIFT_NOT_FOUND:
            '対象のシフトが見つかりません。',
        SHIFT_ALREADY_CANCELLED:
            'このシフトはすでにキャンセルされています。',
        SHIFT_ALREADY_STARTED:
            '開始済みのシフトは削除またはキャンセルできません。',
    }

    return messages[code] ??
        fallbackMessage
}

export function RemoveShiftConfirmation({
    scheduleDate,
    scheduleStatus,
    shift,
    onCancel,
    onRemoved,
}: RemoveShiftConfirmationProps) {
    const removeShiftMutation =
        useRemoveShift()

    const isDraft =
        scheduleStatus === 'DRAFT'

    const apiError =
        removeShiftMutation.isError
            ? toApiError(
                removeShiftMutation.error,
            )
            : null

    function handleConfirm() {
        removeShiftMutation.mutate(
            {
                shiftId: shift.id,
            },
            {
                onSuccess: () => {
                    onRemoved()
                },
            },
        )
    }

    const isSubmitting =
        removeShiftMutation.isPending

    return (
        <section className="mt-8 rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
                <p className="text-sm font-semibold tracking-wide text-red-600">
                    {isDraft
                        ? 'DELETE SHIFT'
                        : 'CANCEL SHIFT'}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    {isDraft
                        ? 'Draftシフトを削除'
                        : '公開済みシフトをキャンセル'}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                    {isDraft
                        ? 'このDraftシフトは完全に削除され、元に戻すことはできません。'
                        : '公開済みシフトは削除されず、キャンセル履歴として保存されます。'}
                </p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <dl className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                        <dt className="font-semibold text-slate-500">
                            対象日
                        </dt>

                        <dd className="mt-1 font-semibold text-slate-950">
                            {scheduleDate}
                        </dd>
                    </div>

                    <div>
                        <dt className="font-semibold text-slate-500">
                            時間
                        </dt>

                        <dd className="mt-1 font-semibold text-slate-950">
                            {formatTime(shift.startAt)}
                            {' – '}
                            {formatTime(shift.endAt)}
                        </dd>
                    </div>

                    <div>
                        <dt className="font-semibold text-slate-500">
                            担当者
                        </dt>

                        <dd className="mt-1 font-semibold text-slate-950">
                            {shift.assignee.user.name}
                        </dd>
                    </div>
                </dl>
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

            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onCancel}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                    戻る
                </button>

                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirm}
                    className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                    {isSubmitting
                        ? '処理中...'
                        : isDraft
                            ? '完全に削除する'
                            : 'シフトをキャンセルする'}
                </button>
            </div>
        </section>
    )
}