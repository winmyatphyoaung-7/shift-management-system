import { useState } from 'react'

import { useManagerCoverageRequests } from '../features/coverage/coverage-hooks.ts'
import { ManagerCoverageReviewForm } from '../features/coverage/manager-coverage-review-form.tsx'
import type {
    CoverageReasonCategory,
    CoverageRequestStatus,
    ManagerCoverageRequest,
} from '../features/coverage/coverage-types.ts'
import { toApiError } from '../lib/api-error.ts'

type StatusFilter =
    | CoverageRequestStatus
    | ''
type ReviewSelection = {
    request: ManagerCoverageRequest
    action: 'APPROVE' | 'REJECT'
}

const STATUS_OPTIONS: Array<{
    value: StatusFilter
    label: string
}> = [
        {
            value: '',
            label: 'すべて',
        },
        {
            value: 'PENDING_REVIEW',
            label: '確認待ち',
        },
        {
            value: 'OPEN',
            label: '募集中',
        },
        {
            value: 'APPROVED',
            label: '承認済み',
        },
        {
            value: 'REJECTED',
            label: '却下',
        },
        {
            value: 'CANCELLED',
            label: 'キャンセル済み',
        },
        {
            value: 'EXPIRED',
            label: '期限切れ',
        },
    ]

function formatDateTime(
    value: string,
): string {
    return new Intl.DateTimeFormat(
        'ja-JP',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        },
    ).format(new Date(value))
}

function getStatusLabel(
    status: CoverageRequestStatus,
): string {
    const labels: Record<
        CoverageRequestStatus,
        string
    > = {
        PENDING_REVIEW:
            'マネージャー確認待ち',
        OPEN: '交代募集中',
        APPROVED: '交代承認済み',
        REJECTED: '却下',
        CANCELLED: 'キャンセル済み',
        EXPIRED: '期限切れ',
    }

    return labels[status]
}

function getStatusTone(
    status: CoverageRequestStatus,
): string {
    if (status === 'PENDING_REVIEW') {
        return 'bg-violet-50 text-violet-700'
    }

    if (status === 'OPEN') {
        return 'bg-amber-50 text-amber-700'
    }

    if (status === 'APPROVED') {
        return 'bg-emerald-50 text-emerald-700'
    }

    if (
        status === 'REJECTED' ||
        status === 'CANCELLED'
    ) {
        return 'bg-red-50 text-red-700'
    }

    return 'bg-slate-100 text-slate-600'
}

function getReasonLabel(
    reason: CoverageReasonCategory,
): string {
    const labels: Record<
        CoverageReasonCategory,
        string
    > = {
        HEALTH: '体調・通院',
        SCHOOL: '学校・授業',
        PERSONAL: '個人的な事情',
        OTHER: 'その他',
    }

    return labels[reason]
}

export function ManagerReplacementsPage() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('')

    const [reviewSelection, setReviewSelection,] = useState<ReviewSelection | null>(null,)

    const requestsQuery =
        useManagerCoverageRequests(
            statusFilter || undefined,
        )

    const requests =
        requestsQuery.data ?? []

    return (
        <section>
            {reviewSelection && (
                <ManagerCoverageReviewForm
                    key={`${reviewSelection.request.id}-${reviewSelection.action}`}
                    request={
                        reviewSelection.request
                    }
                    action={
                        reviewSelection.action
                    }
                    onClose={() => {
                        setReviewSelection(null)
                    }}
                />
            )}
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-blue-600">
                        REPLACEMENT MANAGEMENT
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                        交代依頼管理
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                        スタッフからの交代依頼、募集中の依頼、候補者の状況を確認できます。
                    </p>
                </div>

                <label className="min-w-48">
                    <span className="text-sm font-semibold text-slate-700">
                        ステータス
                    </span>

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(
                                event.target
                                    .value as StatusFilter,
                            )
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                        {STATUS_OPTIONS.map(
                            (option) => (
                                <option
                                    key={
                                        option.value ||
                                        'ALL'
                                    }
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ),
                        )}
                    </select>
                </label>
            </div>

            {requestsQuery.isPending ? (
                <div
                    aria-busy="true"
                    className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
                >
                    <div
                        role="status"
                        className="flex items-center gap-3"
                    >
                        <div className="size-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                        <p className="font-medium text-slate-600">
                            交代依頼を読み込んでいます...
                        </p>
                    </div>
                </div>
            ) : requestsQuery.isError ? (
                <div className="mt-8 rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
                    <p className="text-sm font-semibold text-red-600">
                        読み込みエラー
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                        交代依頼を取得できませんでした
                    </h2>

                    <p className="mt-3 text-sm text-slate-600">
                        {
                            toApiError(
                                requestsQuery.error,
                            ).message
                        }
                    </p>

                    <button
                        type="button"
                        disabled={
                            requestsQuery.isFetching
                        }
                        onClick={() => {
                            void requestsQuery.refetch()
                        }}
                        className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        もう一度試す
                    </button>
                </div>
            ) : requests.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <h2 className="text-lg font-bold text-slate-900">
                        対象の交代依頼はありません
                    </h2>

                    <p className="mt-2 text-sm text-slate-600">
                        選択したステータスに該当する依頼はありません。
                    </p>
                </div>
            ) : (
                <div className="mt-8 grid gap-5 xl:grid-cols-2">
                    {requests.map((request) => (
                        <article
                            key={request.id}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-blue-700">
                                        {formatDateTime(
                                            request.requestedStartAt,
                                        )}
                                        {' 〜 '}
                                        {formatDateTime(
                                            request.requestedEndAt,
                                        )}
                                    </p>

                                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                                        {
                                            request
                                                .originalAssignee
                                                .user.name
                                        }
                                        さんのシフト
                                    </h2>
                                </div>

                                <span
                                    className={[
                                        'rounded-full px-3 py-1 text-xs font-bold',
                                        getStatusTone(
                                            request.status,
                                        ),
                                    ].join(' ')}
                                >
                                    {getStatusLabel(
                                        request.status,
                                    )}
                                </span>
                            </div>

                            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="font-semibold text-slate-500">
                                        依頼者
                                    </dt>
                                    <dd className="mt-1 font-medium text-slate-900">
                                        {
                                            request.requester
                                                .user.name
                                        }
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-semibold text-slate-500">
                                        作成方法
                                    </dt>
                                    <dd className="mt-1 font-medium text-slate-900">
                                        {request.source ===
                                            'STAFF'
                                            ? 'スタッフ申請'
                                            : 'マネージャー作成'}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-semibold text-slate-500">
                                        理由
                                    </dt>
                                    <dd className="mt-1 font-medium text-slate-900">
                                        {getReasonLabel(
                                            request.reasonCategory,
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-semibold text-slate-500">
                                        候補者
                                    </dt>
                                    <dd className="mt-1 font-medium text-slate-900">
                                        {
                                            request._count
                                                .candidates
                                        }
                                        人
                                    </dd>
                                </div>

                                <div className="sm:col-span-2">
                                    <dt className="font-semibold text-slate-500">
                                        回答期限
                                    </dt>
                                    <dd className="mt-1 font-medium text-slate-900">
                                        {request.responseDeadline
                                            ? formatDateTime(
                                                request.responseDeadline,
                                            )
                                            : '未設定'}
                                    </dd>
                                </div>
                            </dl>

                            {request.reasonDetails && (
                                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                                    <p className="text-xs font-semibold text-slate-500">
                                        詳細
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                        {request.reasonDetails}
                                    </p>
                                </div>
                            )}

                            {request.rejectionNote && (
                                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-xs font-semibold text-red-600">
                                        却下理由
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-700">
                                        {
                                            request.rejectionNote
                                        }
                                    </p>
                                </div>
                            )}

                            {request.candidates.length >
                                0 && (
                                    <div className="mt-5 border-t border-slate-200 pt-5">
                                        <p className="text-sm font-semibold text-slate-700">
                                            候補者
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {request.candidates.map(
                                                (candidate) => (
                                                    <span
                                                        key={candidate.id}
                                                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                                    >
                                                        {
                                                            candidate
                                                                .membership
                                                                .user.name
                                                        }
                                                        {' · '}
                                                        {
                                                            candidate.status
                                                        }
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {request.status ===
                                'PENDING_REVIEW' && (
                                    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReviewSelection({
                                                    request,
                                                    action:
                                                        'APPROVE',
                                                })
                                            }}
                                            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            承認して募集開始
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReviewSelection({
                                                    request,
                                                    action:
                                                        'REJECT',
                                                })
                                            }}
                                            className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                                        >
                                            却下
                                        </button>
                                    </div>
                                )}

                            <p className="mt-5 text-xs text-slate-400">
                                受付：
                                {formatDateTime(
                                    request.createdAt,
                                )}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}