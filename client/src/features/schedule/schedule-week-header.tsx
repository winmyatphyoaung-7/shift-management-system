import {
    parseDateKey,
} from './schedule-date.ts'
import type {
    ScheduleDateRange,
} from './schedule-types.ts'

type ScheduleWeekHeaderProps = {
    range: ScheduleDateRange
    isManager: boolean
    isRefreshing: boolean
    onPublishSchedule: () => void
    onPreviousWeek: () => void
    onCurrentWeek: () => void
    onNextWeek: () => void
    onCopyWeek: () => void
    onClearDraftRange: () => void
}

const rangeStartFormatter =
    new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

const rangeEndFormatter =
    new Intl.DateTimeFormat('ja-JP', {
        month: 'long',
        day: 'numeric',
    })

function formatRangeLabel(
    range: ScheduleDateRange,
): string {
    return [
        rangeStartFormatter.format(
            parseDateKey(range.from),
        ),
        rangeEndFormatter.format(
            parseDateKey(range.to),
        ),
    ].join(' 〜 ')
}

export function ScheduleWeekHeader({
    range,
    isManager,
    isRefreshing,
    onPreviousWeek,
    onCurrentWeek,
    onNextWeek,
    onPublishSchedule,
    onCopyWeek,
    onClearDraftRange,
}: ScheduleWeekHeaderProps) {
    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-blue-600">
                        WEEKLY SCHEDULE
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                        週間シフト
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        {isManager
                            ? 'Draftと公開済みのシフトを確認できます。'
                            : '公開済みのシフトを確認できます。'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isManager && (
                        <button
                            type="button"
                            onClick={onClearDraftRange}
                            className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                        >
                            Draftを削除
                        </button>
                    )}
                    {isManager && (
                        <button
                            type="button"
                            onClick={onCopyWeek}
                            className="rounded-xl border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                        >
                            翌週へコピー
                        </button>
                    )}
                    {isManager && (
                        <button
                            type="button"
                            onClick={onPublishSchedule}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            シフトを公開
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onPreviousWeek}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        前の週
                    </button>

                    <button
                        type="button"
                        onClick={onCurrentWeek}
                        className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                        今週
                    </button>

                    <button
                        type="button"
                        onClick={onNextWeek}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        次の週
                    </button>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="font-semibold text-slate-950">
                    {formatRangeLabel(range)}
                </p>

                {isRefreshing && (
                    <p
                        role="status"
                        className="text-sm text-blue-600"
                    >
                        更新中...
                    </p>
                )}
            </div>
        </>
    )
}