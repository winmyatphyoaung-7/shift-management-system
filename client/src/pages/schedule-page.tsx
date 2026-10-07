import {
    useEffect,
    useState,
} from 'react'

import { useCurrentMember } from '../features/auth/auth-hooks.ts'
import { CreateShiftForm } from '../features/schedule/create-shift-form.tsx'
import { EditShiftForm } from '../features/schedule/edit-shift-form.tsx'
import { RemoveShiftConfirmation } from '../features/schedule/remove-shift-confirmation.tsx'
import { PublishScheduleForm } from '../features/schedule/publish-schedule-form.tsx'
import { CopyWeekForm } from '../features/schedule/copy-week-form.tsx'
import { ClearDraftRangeForm } from '../features/schedule/clear-draft-range-form.tsx'
import { ScheduleDayCard } from '../features/schedule/schedule-day-card.tsx'
import { ScheduleWeekHeader } from '../features/schedule/schedule-week-header.tsx'
import {
    addDays,
    getWeekRange,
    shiftDateRange,
} from '../features/schedule/schedule-date.ts'
import { useScheduleDays } from '../features/schedule/schedule-hooks.ts'
import type {
    ScheduleCoveragePreset,
    ScheduleDateRange,
    ScheduleDayStatus,
    ScheduleShift,
    PublishScheduleResult,
    CopyWeekCompletedResult,
    ClearDraftRangeCompletedResult,
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
type RemovingShift = {
    scheduleDate: string
    scheduleStatus: ScheduleDayStatus
    shift: ScheduleShift
}

type RemovedShiftAction =
    | 'DELETED'
    | 'CANCELLED'

const INITIAL_CURRENT_TIME =
    Date.now()

export function SchedulePage() {
    const [range, setRange] =
        useState<ScheduleDateRange>(
            () => getWeekRange(),
        )

    const [
        currentTime,
        setCurrentTime,
    ] = useState(INITIAL_CURRENT_TIME)

    useEffect(() => {
        const timerId = window.setInterval(
            () => {
                setCurrentTime(Date.now())
            },
            60 * 1000,
        )

        return () => {
            window.clearInterval(timerId)
        }
    }, [])

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

    const [
        removingShift,
        setRemovingShift,
    ] = useState<RemovingShift | null>(
        null,
    )

    const [
        removedShiftAction,
        setRemovedShiftAction,
    ] =
        useState<RemovedShiftAction | null>(
            null,
        )
    const [
        isPublishFormOpen,
        setIsPublishFormOpen,
    ] = useState(false)

    const [
        publishedSummary,
        setPublishedSummary,
    ] = useState<
        PublishScheduleResult['summary'] | null
    >(null)

    const [
        isCopyWeekFormOpen,
        setIsCopyWeekFormOpen,
    ] = useState(false)

    const [
        copiedWeekResult,
        setCopiedWeekResult,
    ] =
        useState<CopyWeekCompletedResult | null>(
            null,
        )

    const [
        isClearDraftRangeFormOpen,
        setIsClearDraftRangeFormOpen,
    ] = useState(false)

    const [
        clearedDraftRangeResult,
        setClearedDraftRangeResult,
    ] =
        useState<
            ClearDraftRangeCompletedResult | null
        >(null)
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

    function resetOperationState() {
        setCreateShiftDate(null)
        setEditingShift(null)
        setRemovingShift(null)

        setCreatedShiftSummary(null)
        setUpdatedShiftSummary(null)
        setRemovedShiftAction(null)
        setIsPublishFormOpen(false)
        setPublishedSummary(null)
        setIsCopyWeekFormOpen(false)
        setCopiedWeekResult(null)
        setIsClearDraftRangeFormOpen(false)
        setClearedDraftRangeResult(null)
    }

    function moveWeek(dayOffset: number) {
        resetOperationState()

        setRange((current) =>
            shiftDateRange(
                current,
                dayOffset,
            ),
        )
    }

    function moveToCurrentWeek() {
        resetOperationState()
        setRange(getWeekRange())
    }

    return (
        <section>
            <ScheduleWeekHeader
                range={range}
                isManager={
                    member.role === 'MANAGER'
                }
                isRefreshing={
                    isFetching && !isPending
                }
                onPreviousWeek={() => {
                    moveWeek(-7)
                }}
                onCurrentWeek={
                    moveToCurrentWeek
                }
                onNextWeek={() => {
                    moveWeek(7)
                }}
                onPublishSchedule={() => {
                    resetOperationState()
                    setIsPublishFormOpen(true)
                }}
                onCopyWeek={() => {
                    resetOperationState()
                    setIsCopyWeekFormOpen(true)
                }}
                onClearDraftRange={() => {
                    resetOperationState()
                    setIsClearDraftRangeFormOpen(true)
                }}
            />

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

            {removedShiftAction && (
                <div
                    role="status"
                    className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                >
                    {removedShiftAction === 'DELETED'
                        ? 'Draftシフトを削除しました。'
                        : '公開済みシフトをキャンセルしました。'}
                </div>
            )}

            {publishedSummary && (
                <div
                    role="status"
                    className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                    <p className="font-semibold">
                        {
                            publishedSummary
                                .publishedDateCount
                        }
                        日分のシフトを公開しました。
                    </p>

                    <p className="mt-1">
                        公開シフト：
                        {publishedSummary.shiftCount}
                        件
                    </p>

                    {publishedSummary
                        .coverageWarningCount > 0 && (
                            <p className="mt-1 text-amber-700">
                                人員不足の警告：
                                {
                                    publishedSummary
                                        .coverageWarningCount
                                }
                                件
                            </p>
                        )}
                </div>
            )}

            {copiedWeekResult && (
                <div
                    role="status"
                    className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                    <p className="font-semibold">
                        翌週へシフトをコピーしました。
                    </p>

                    <p className="mt-1">
                        作成日数：
                        {
                            copiedWeekResult
                                .createdScheduleDayCount
                        }
                        日
                        {' · '}
                        作成シフト：
                        {
                            copiedWeekResult
                                .createdShiftCount
                        }
                        件
                    </p>

                    {copiedWeekResult.preview
                        .skippedShiftCount > 0 && (
                            <p className="mt-1 text-amber-700">
                                スキップされたシフト：
                                {
                                    copiedWeekResult.preview
                                        .skippedShiftCount
                                }
                                件
                            </p>
                        )}
                </div>
            )}

            {clearedDraftRangeResult && (
                <div
                    role="status"
                    className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                    <p className="font-semibold">
                        Draftスケジュールを削除しました。
                    </p>

                    <p className="mt-1">
                        Schedule Day：
                        {
                            clearedDraftRangeResult
                                .deletedScheduleDayCount
                        }
                        件
                        {' · '}
                        シフト：
                        {
                            clearedDraftRangeResult
                                .deletedShiftCount
                        }
                        件
                        {' · '}
                        人員要件：
                        {
                            clearedDraftRangeResult
                                .deletedCoverageRequirementCount
                        }
                        件
                    </p>
                </div>
            )}

            {member.role === 'MANAGER' &&
                isPublishFormOpen && (
                    <PublishScheduleForm
                        initialRange={range}
                        onCancel={() => {
                            setIsPublishFormOpen(false)
                        }}
                        onPublished={(result) => {
                            setIsPublishFormOpen(false)
                            setPublishedSummary(
                                result.summary,
                            )
                        }}
                    />
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

            {member.role === 'MANAGER' &&
                removingShift && (
                    <RemoveShiftConfirmation
                        key={removingShift.shift.id}
                        scheduleDate={
                            removingShift.scheduleDate
                        }
                        scheduleStatus={
                            removingShift.scheduleStatus
                        }
                        shift={removingShift.shift}
                        onCancel={() => {
                            setRemovingShift(null)
                        }}
                        onRemoved={() => {
                            const action =
                                removingShift.scheduleStatus ===
                                    'DRAFT'
                                    ? 'DELETED'
                                    : 'CANCELLED'

                            setRemovingShift(null)
                            setRemovedShiftAction(action)
                        }}
                    />
                )}

            {member.role === 'MANAGER' &&
                isCopyWeekFormOpen && (
                    <CopyWeekForm
                        initialSourceWeekStart={
                            range.from
                        }
                        onCancel={() => {
                            setIsCopyWeekFormOpen(false)
                        }}
                        onCopied={(result) => {
                            setIsCopyWeekFormOpen(false)
                            setCopiedWeekResult(result)

                            setRange(
                                result.preview.targetWeek,
                            )
                        }}
                    />
                )}

            {member.role === 'MANAGER' &&
                isClearDraftRangeFormOpen && (
                    <ClearDraftRangeForm
                        initialRange={range}
                        onCancel={() => {
                            setIsClearDraftRangeFormOpen(
                                false,
                            )
                        }}
                        onCleared={(result) => {
                            setIsClearDraftRangeFormOpen(
                                false,
                            )

                            setClearedDraftRangeResult(
                                result,
                            )
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
                            <ScheduleDayCard
                                key={date}
                                date={date}
                                scheduleDay={scheduleDay}
                                isManager={
                                    member.role === 'MANAGER'
                                }
                                currentMembershipId={
                                    member.membershipId
                                }
                                currentTime={currentTime}
                                onCreateShift={() => {
                                    resetOperationState()
                                    setCreateShiftDate(date)
                                }}
                                onEditShift={(shift) => {
                                    resetOperationState()

                                    setEditingShift({
                                        scheduleDate: date,
                                        shift,
                                    })
                                }}
                                onRemoveShift={(shift) => {
                                    if (!scheduleDay) {
                                        return
                                    }

                                    resetOperationState()

                                    setRemovingShift({
                                        scheduleDate: date,
                                        scheduleStatus:
                                            scheduleDay.status,
                                        shift,
                                    })
                                }}
                            />
                        )
                    })}
                </div>
            )}
        </section>
    )
}