import {
    parseDateKey,
} from './schedule-date.ts'
import type {
    ScheduleDay,
    ScheduleShift,
} from './schedule-types.ts'

type ScheduleDayCardProps = {
    date: string
    scheduleDay?: ScheduleDay
    isManager: boolean
    currentMembershipId: string
    currentTime: number
    onCreateShift: () => void
    onEditShift: (
        shift: ScheduleShift,
    ) => void
    onRemoveShift: (
        shift: ScheduleShift,
    ) => void
}

const dayFormatter =
    new Intl.DateTimeFormat('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
    })

const timeFormatter =
    new Intl.DateTimeFormat('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })

function formatDayLabel(
    value: string,
): string {
    return dayFormatter.format(
        parseDateKey(value),
    )
}

function formatTime(
    value: string,
): string {
    return timeFormatter.format(
        new Date(value),
    )
}

export function ScheduleDayCard({
    date,
    scheduleDay,
    isManager,
    currentMembershipId,
    currentTime,
    onCreateShift,
    onEditShift,
    onRemoveShift,
}: ScheduleDayCardProps) {
    return (
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-950">
                    {formatDayLabel(date)}
                </h2>

                {scheduleDay && (
                    <span
                        className={[
                            'rounded-full px-2 py-1 text-xs font-semibold',
                            scheduleDay.status ===
                                'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700',
                        ].join(' ')}
                    >
                        {scheduleDay.status ===
                            'PUBLISHED'
                            ? '公開済み'
                            : 'Draft'}
                    </span>
                )}
            </div>

            {isManager &&
                scheduleDay?.status !==
                'PUBLISHED' && (
                    <button
                        type="button"
                        onClick={onCreateShift}
                        className="mt-3 w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                        シフト追加
                    </button>
                )}

            {!scheduleDay ? (
                <p className="py-8 text-center text-sm leading-6 text-slate-500">
                    {isManager
                        ? 'スケジュールがありません。'
                        : '公開されたシフトはありません。'}
                </p>
            ) : (
                <>
                    {isManager &&
                        scheduleDay.coverageWarnings
                            .length > 0 && (
                            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                                人員不足：
                                {
                                    scheduleDay
                                        .coverageWarnings.length
                                }
                                枠
                            </p>
                        )}

                    {scheduleDay.shifts.length ===
                        0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            シフトはありません。
                        </p>
                    ) : (
                        <div className="mt-3 space-y-3">
                            {scheduleDay.shifts.map(
                                (shift) => {
                                    const isOwnShift =
                                        shift.assignee.id ===
                                        currentMembershipId

                                    const canManageShift =
                                        isManager &&
                                        shift.status ===
                                        'ACTIVE' &&
                                        new Date(
                                            shift.startAt,
                                        ).getTime() > currentTime

                                    return (
                                        <div
                                            key={shift.id}
                                            className={[
                                                'rounded-xl border p-3',
                                                shift.status ===
                                                    'CANCELLED'
                                                    ? 'border-slate-200 bg-slate-50 opacity-60'
                                                    : isOwnShift
                                                        ? 'border-blue-300 bg-blue-50'
                                                        : 'border-slate-200 bg-white',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-bold text-slate-950">
                                                    {formatTime(
                                                        shift.startAt,
                                                    )}
                                                    {' – '}
                                                    {formatTime(
                                                        shift.endAt,
                                                    )}
                                                </p>

                                                {isOwnShift && (
                                                    <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
                                                        自分
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-2 truncate text-sm font-semibold text-slate-700">
                                                {
                                                    shift.assignee.user
                                                        .name
                                                }
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {shift.shiftPreset
                                                    ?.name ?? 'カスタム'}
                                                {' · '}
                                                休憩
                                                {shift.breakMinutes}
                                                分
                                            </p>

                                            {shift.note && (
                                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                                    {shift.note}
                                                </p>
                                            )}

                                            {shift.status ===
                                                'CANCELLED' && (
                                                    <p className="mt-2 text-xs font-semibold text-red-600">
                                                        キャンセル済み
                                                    </p>
                                                )}

                                            {canManageShift && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onEditShift(
                                                                shift,
                                                            )
                                                        }}
                                                        className="mt-3 w-full rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                                    >
                                                        編集
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onRemoveShift(
                                                                shift,
                                                            )
                                                        }}
                                                        className="mt-2 w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                                    >
                                                        {scheduleDay.status ===
                                                            'DRAFT'
                                                            ? '削除'
                                                            : 'キャンセル'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )
                                },
                            )}
                        </div>
                    )}
                </>
            )}
        </article>
    )
}