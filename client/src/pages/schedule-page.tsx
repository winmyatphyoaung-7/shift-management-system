import { useState } from 'react'

import { useCurrentMember } from '../features/auth/auth-hooks.ts'
import { CreateShiftForm } from '../features/schedule/create-shift-form.tsx'
import { EditShiftForm } from '../features/schedule/edit-shift-form.tsx'
import {
    addDays,
    getWeekRange,
    parseDateKey,
    shiftDateRange,
} from '../features/schedule/schedule-date.ts'
import { useScheduleDays } from '../features/schedule/schedule-hooks.ts'
import type {
    ScheduleCoveragePreset,
    ScheduleDateRange,
    ScheduleShift,
} from '../features/schedule/schedule-types.ts'
import { toApiError } from '../lib/api-error.ts'


type CreatedShiftSummary = {
    shiftCount: number
    adjacentWarningCount: number
}
type EditingShift = {
    scheduleDate: string
    shift: ScheduleShift
}

type UpdatedShiftSummary = {
    adjacentWarningCount: number
}

const dayFormatter =
    new Intl.DateTimeFormat('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
    })

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

function formatTime(
    value: string,
): string {
    return timeFormatter.format(
        new Date(value),
    )
}

export function SchedulePage() {
    const [range, setRange] =
        useState<ScheduleDateRange>(
            () => getWeekRange(),
        )

    const [
        createShiftDate,
        setCreateShiftDate,
    ] = useState<string | null>(null)

    const [
        createdShiftSummary,
        setCreatedShiftSummary,
    ] =
        useState<CreatedShiftSummary | null>(
            null,
        )

    const [
        editingShift,
        setEditingShift,
    ] = useState<EditingShift | null>(
        null,
    )

    const [
        updatedShiftSummary,
        setUpdatedShiftSummary,
    ] =
        useState<UpdatedShiftSummary | null>(
            null,
        )

    const { data: member } =
        useCurrentMember()

    const {
        data: scheduleDays = [],
        error,
        isError,
        isFetching,
        isPending,
        refetch,
    } = useScheduleDays(range)

    if (!member) {
        return null
    }

    const dates = Array.from(
        {
            length: 7,
        },
        (_, index) =>
            addDays(range.from, index),
    )

    const scheduleDayByDate =
        new Map(
            scheduleDays.map(
                (scheduleDay) => [
                    scheduleDay.scheduleDate,
                    scheduleDay,
                ],
            ),
        )

    const presetById =
        new Map<
            string,
            ScheduleCoveragePreset
        >()

    for (
        const scheduleDay of scheduleDays
    ) {
        for (
            const requirement of
            scheduleDay.coverageRequirements
        ) {
            presetById.set(
                requirement.shiftPreset.id,
                requirement.shiftPreset,
            )
        }
    }

    const availablePresets = [
        ...presetById.values(),
    ].sort(
        (first, second) =>
            first.sortOrder -
            second.sortOrder,
    )

    return (
        <section>
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-blue-600">
                        WEEKLY SCHEDULE
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                        週間シフト
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        {member.role === 'MANAGER'
                            ? 'Draftと公開済みのシフトを確認できます。'
                            : '公開済みのシフトを確認できます。'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {

                            setCreateShiftDate(null)
                            setCreatedShiftSummary(null)
                            setEditingShift(null)
                            setUpdatedShiftSummary(null)

                            setRange((current) =>
                                shiftDateRange(
                                    current,
                                    -7,
                                ),
                            )
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        前の週
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setCreateShiftDate(null)
                            setCreatedShiftSummary(null)
                            setEditingShift(null)
                            setUpdatedShiftSummary(null)
                            setRange(getWeekRange())
                        }}
                        className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                        今週
                    </button>

                    <button
                        type="button"
                        onClick={() => {

                            setCreateShiftDate(null)
                            setCreatedShiftSummary(null)
                            setEditingShift(null)
                            setUpdatedShiftSummary(null)

                            setRange((current) =>
                                shiftDateRange(
                                    current,
                                    7,
                                ),
                            )
                        }}
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

                {isFetching && !isPending && (
                    <p
                        role="status"
                        className="text-sm text-blue-600"
                    >
                        更新中...
                    </p>
                )}
            </div>

            {createdShiftSummary && (
                <div
                    role="status"
                    className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                    <p className="font-semibold">
                        {
                            createdShiftSummary
                                .shiftCount
                        }
                        件のDraftシフトを作成しました。
                    </p>

                    {createdShiftSummary
                        .adjacentWarningCount >
                        0 && (
                            <p className="mt-1 text-amber-700">
                                連続するシフトの警告：
                                {
                                    createdShiftSummary
                                        .adjacentWarningCount
                                }
                                件
                            </p>
                        )}
                </div>
            )}

            {updatedShiftSummary && (
                <div
                    role="status"
                    className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                    <p className="font-semibold">
                        シフトを更新しました。
                    </p>

                    {updatedShiftSummary
                        .adjacentWarningCount > 0 && (
                            <p className="mt-1 text-amber-700">
                                連続するシフトの警告：
                                {
                                    updatedShiftSummary
                                        .adjacentWarningCount
                                }
                                件
                            </p>
                        )}
                </div>
            )}

            {member.role === 'MANAGER' &&
                createShiftDate && (
                    <CreateShiftForm
                        key={createShiftDate}
                        scheduleDate={
                            createShiftDate
                        }
                        presets={
                            availablePresets
                        }
                        onCancel={() => {
                            setCreateShiftDate(null)
                        }}
                        onCreated={(result) => {
                            setCreateShiftDate(null)

                            setCreatedShiftSummary({
                                shiftCount:
                                    result.shifts.length,
                                adjacentWarningCount:
                                    result.warnings.length,
                            })
                        }}
                    />
                )}

            {member.role === 'MANAGER' &&
                editingShift && (
                    <EditShiftForm
                        key={editingShift.shift.id}
                        scheduleDate={
                            editingShift.scheduleDate
                        }
                        shift={editingShift.shift}
                        presets={availablePresets}
                        onCancel={() => {
                            setEditingShift(null)
                        }}
                        onUpdated={(result) => {
                            setEditingShift(null)

                            setUpdatedShiftSummary({
                                adjacentWarningCount:
                                    result.warnings.length,
                            })
                        }}
                    />
                )}

            {isPending ? (
                <div
                    className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
                    aria-busy="true"
                >
                    <div
                        role="status"
                        className="flex items-center gap-3"
                    >
                        <div className="size-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                        <p className="font-medium text-slate-600">
                            シフトを読み込んでいます...
                        </p>
                    </div>
                </div>
            ) : isError ? (
                <div className="mt-8 rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
                    <p className="text-sm font-semibold text-red-600">
                        読み込みエラー
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                        シフトを取得できませんでした
                    </h2>

                    <p className="mt-3 text-sm text-slate-600">
                        {toApiError(error).message}
                    </p>

                    <button
                        type="button"
                        disabled={isFetching}
                        onClick={() => {
                            void refetch()
                        }}
                        className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        もう一度試す
                    </button>
                </div>
            ) : (
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                    {dates.map((date) => {
                        const scheduleDay =
                            scheduleDayByDate.get(date)

                        return (
                            <article
                                key={date}
                                className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
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

                                {member.role ===
                                    'MANAGER' &&
                                    scheduleDay?.status !==
                                    'PUBLISHED' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCreatedShiftSummary(null)
                                                setCreateShiftDate(date)
                                                setEditingShift(null)
                                                setUpdatedShiftSummary(null)
                                            }}
                                            className="mt-3 w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                        >
                                            シフト追加
                                        </button>
                                    )}

                                {!scheduleDay ? (
                                    <p className="py-8 text-center text-sm leading-6 text-slate-500">
                                        {member.role ===
                                            'MANAGER'
                                            ? 'スケジュールがありません。'
                                            : '公開されたシフトはありません。'}
                                    </p>
                                ) : (
                                    <>
                                        {member.role ===
                                            'MANAGER' &&
                                            scheduleDay
                                                .coverageWarnings
                                                .length > 0 && (
                                                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                                                    人員不足：
                                                    {
                                                        scheduleDay
                                                            .coverageWarnings
                                                            .length
                                                    }
                                                    枠
                                                </p>
                                            )}

                                        {scheduleDay.shifts
                                            .length === 0 ? (
                                            <p className="py-8 text-center text-sm text-slate-500">
                                                シフトはありません。
                                            </p>
                                        ) : (
                                            <div className="mt-3 space-y-3">
                                                {scheduleDay.shifts.map(
                                                    (shift) => {
                                                        const isOwnShift =
                                                            shift
                                                                .assignee
                                                                .id ===
                                                            member.membershipId

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
                                                                ].join(
                                                                    ' ',
                                                                )}
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
                                                                        shift
                                                                            .assignee
                                                                            .user
                                                                            .name
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {shift.shiftPreset
                                                                        ?.name ??
                                                                        'カスタム'}
                                                                    {' · '}
                                                                    休憩
                                                                    {
                                                                        shift.breakMinutes
                                                                    }
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

                                                                {member.role === 'MANAGER' &&
                                                                    shift.status === 'ACTIVE' &&
                                                                    new Date(
                                                                        shift.startAt,
                                                                    ).getTime() > Date.now() && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setCreateShiftDate(null)
                                                                                setCreatedShiftSummary(null)
                                                                                setUpdatedShiftSummary(null)

                                                                                setEditingShift({
                                                                                    scheduleDate: date,
                                                                                    shift,
                                                                                })
                                                                            }}
                                                                            className="mt-3 w-full rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                                                        >
                                                                            編集
                                                                        </button>
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
                    })}
                </div>
            )}
        </section>
    )
}