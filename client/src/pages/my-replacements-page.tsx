import {
    useEffect,
    useState,
} from 'react'

import {
    useSearchParams,
} from 'react-router'

import {
    useCancelCoverageRequest,
    useMyCoverageActivity,
    useWithdrawCoverageResponse,
} from '../features/coverage/coverage-hooks.ts'
import type {
    CoverageCandidateStatus,
    CoverageReasonCategory,
    CoverageRequestStatus,
} from '../features/coverage/coverage-types.ts'
import { CoverageActionConfirmation } from '../features/coverage/coverage-action-confirmation.tsx'
import { toApiError } from '../lib/api-error.ts'

type CoverageConfirmation = {
    action:
    | 'CANCEL_REQUEST'
    | 'WITHDRAW_RESPONSE'
    coverageRequestId: string
}

const INITIAL_CURRENT_TIME = Date.now()

function formatDateTime(
    value: string,
): string {
    return new Intl.DateTimeFormat(
        'ja-JP',
        {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        },
    ).format(new Date(value))
}

function getRequestStatusLabel(
    status: CoverageRequestStatus,
): string {
    const labels: Record<
        CoverageRequestStatus,
        string
    > = {
        PENDING_REVIEW: 'マネージャー確認待ち',
        OPEN: '交代募集中',
        APPROVED: '交代承認済み',
        REJECTED: '却下',
        CANCELLED: 'キャンセル済み',
        EXPIRED: '期限切れ',
    }

    return labels[status]
}

function getCandidateStatusLabel(
    status: CoverageCandidateStatus,
): string {
    const labels: Record<
        CoverageCandidateStatus,
        string
    > = {
        PENDING: '回答待ち',
        AVAILABLE: '参加希望中',
        DECLINED: '辞退済み',
        WITHDRAWN: '取り下げ済み',
        SELECTED: '選出済み',
        NOT_SELECTED: '未選出',
        EXPIRED: '期限切れ',
    }

    return labels[status]
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

function getRequestStatusTone(
    status: CoverageRequestStatus,
): string {
    if (
        status === 'PENDING_REVIEW' ||
        status === 'OPEN'
    ) {
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

export function MyReplacementsPage() {

    const [searchParams] =
        useSearchParams()

    const requestedRequestId =
        searchParams.get('requestId')

    const [currentTime, setCurrentTime] = useState(INITIAL_CURRENT_TIME)
    const [confirmation, setConfirmation,] = useState<CoverageConfirmation | null>(null)

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

    const activityQuery =
        useMyCoverageActivity()

    useEffect(() => {
        if (
            !requestedRequestId ||
            !activityQuery.data
        ) {
            return
        }

        const ownRequest =
            document.getElementById(
                `own-coverage-request-${requestedRequestId}`,
            )

        const candidacy =
            document.getElementById(
                `coverage-candidacy-${requestedRequestId}`,
            )

            ; (ownRequest ?? candidacy)
                ?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                })
    }, [
        requestedRequestId,
        activityQuery.data,
    ])

    const cancelMutation =
        useCancelCoverageRequest()

    const withdrawMutation =
        useWithdrawCoverageResponse()

    const failedMutation =
        [cancelMutation, withdrawMutation]
            .find(
                (mutation) =>
                    mutation.isError,
            )

    const actionError =
        failedMutation?.error
            ? toApiError(
                failedMutation.error,
            )
            : null

    const isActionPending =
        cancelMutation.isPending ||
        withdrawMutation.isPending

    if (activityQuery.isLoading) {
        return (
            <p className="text-sm text-slate-600">
                交代依頼を読み込んでいます...
            </p>
        )
    }

    if (
        activityQuery.isError ||
        !activityQuery.data
    ) {
        const error = toApiError(
            activityQuery.error,
        )

        return (
            <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
                交代依頼を読み込めませんでした。
                {error.message}
            </p>
        )
    }

    const {
        coverageRequests,
        candidacies,
    } = activityQuery.data

    return (
        <section className="space-y-10">
            <div>
                <p className="text-sm font-semibold tracking-wide text-blue-600">
                    MY REPLACEMENTS
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    自分の交代
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    自分が申請した交代依頼と、
                    参加した交代募集を確認できます。
                </p>
            </div>

            {actionError && (
                <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    操作を完了できませんでした。
                    {actionError.message}
                </p>
            )}

            <section>
                <h2 className="text-xl font-bold text-slate-950">
                    自分の申請
                </h2>

                {coverageRequests.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
                        申請した交代依頼はありません。
                    </p>
                ) : (
                    <div className="mt-4 grid gap-5 lg:grid-cols-2">
                        {coverageRequests.map(
                            (request) => {
                                const canCancel =
                                    (
                                        request.status ===
                                        'PENDING_REVIEW' ||
                                        request.status ===
                                        'OPEN'
                                    ) &&
                                    new Date(
                                        request
                                            .requestedStartAt,
                                    ).getTime() >
                                    currentTime

                                return (
                                    <article
                                        key={request.id}
                                        id={`own-coverage-request-${request.id}`}
                                        className={[
                                            'scroll-mt-6 rounded-3xl border bg-white p-6 shadow-sm transition',
                                            request.id ===
                                                requestedRequestId
                                                ? 'border-blue-400 ring-4 ring-blue-100'
                                                : 'border-slate-200',
                                        ].join(' ')}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <h3 className="font-bold text-slate-950">
                                                {formatDateTime(
                                                    request
                                                        .requestedStartAt,
                                                )}
                                                {' ～ '}
                                                {formatDateTime(
                                                    request
                                                        .requestedEndAt,
                                                )}
                                            </h3>

                                            <span
                                                className={[
                                                    'rounded-full px-3 py-1 text-xs font-bold',
                                                    getRequestStatusTone(
                                                        request.status,
                                                    ),
                                                ].join(' ')}
                                            >
                                                {getRequestStatusLabel(
                                                    request.status,
                                                )}
                                            </span>
                                        </div>

                                        <dl className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                                            <div>
                                                <dt className="text-slate-500">
                                                    理由
                                                </dt>
                                                <dd className="mt-1 font-semibold text-slate-900">
                                                    {getReasonLabel(
                                                        request
                                                            .reasonCategory,
                                                    )}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-slate-500">
                                                    候補者
                                                </dt>
                                                <dd className="mt-1 font-semibold text-slate-900">
                                                    {
                                                        request._count
                                                            .candidates
                                                    }
                                                    人
                                                </dd>
                                            </div>

                                            {request.responseDeadline && (
                                                <div className="sm:col-span-2">
                                                    <dt className="text-slate-500">
                                                        回答期限
                                                    </dt>
                                                    <dd className="mt-1 font-semibold text-slate-900">
                                                        {formatDateTime(
                                                            request
                                                                .responseDeadline,
                                                        )}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>

                                        {request.reasonDetails && (
                                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                                {request.reasonDetails}
                                            </p>
                                        )}

                                        {request.rejectionNote && (
                                            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                                却下理由：
                                                {request.rejectionNote}
                                            </p>
                                        )}

                                        {canCancel && (
                                            <button
                                                type="button"
                                                disabled={
                                                    isActionPending
                                                }
                                                onClick={() => {
                                                    cancelMutation.reset()
                                                    withdrawMutation.reset()

                                                    setConfirmation({
                                                        action: 'CANCEL_REQUEST',
                                                        coverageRequestId:
                                                            request.id,
                                                    })
                                                }}
                                                className="mt-5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                                            >
                                                {cancelMutation
                                                    .isPending
                                                    ? '処理中...'
                                                    : '依頼をキャンセル'}
                                            </button>
                                        )}
                                    </article>
                                )
                            },
                        )}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-950">
                    参加・オファー履歴
                </h2>

                {candidacies.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
                        参加した交代募集はありません。
                    </p>
                ) : (
                    <div className="mt-4 grid gap-5 lg:grid-cols-2">
                        {candidacies.map(
                            (candidacy) => {
                                const request =
                                    candidacy.coverageRequest

                                const canWithdraw =
                                    candidacy.status ===
                                    'AVAILABLE' &&
                                    request.status ===
                                    'OPEN' &&
                                    new Date(
                                        request
                                            .requestedStartAt,
                                    ).getTime() >
                                    currentTime

                                return (
                                    <article
                                        key={candidacy.id}
                                        id={`coverage-candidacy-${request.id}`}
                                        className={[
                                            'scroll-mt-6 rounded-3xl border bg-white p-6 shadow-sm transition',
                                            request.id ===
                                                requestedRequestId
                                                ? 'border-blue-400 ring-4 ring-blue-100'
                                                : 'border-slate-200',
                                        ].join(' ')}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-blue-600">
                                                    {
                                                        request
                                                            .originalAssignee
                                                            .user.name
                                                    }
                                                    さんのシフト
                                                </p>

                                                <h3 className="mt-2 font-bold text-slate-950">
                                                    {formatDateTime(
                                                        request
                                                            .requestedStartAt,
                                                    )}
                                                    {' ～ '}
                                                    {formatDateTime(
                                                        request
                                                            .requestedEndAt,
                                                    )}
                                                </h3>
                                            </div>

                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                                {getCandidateStatusLabel(
                                                    candidacy.status,
                                                )}
                                            </span>
                                        </div>

                                        <p className="mt-4 text-sm text-slate-600">
                                            {candidacy.type ===
                                                'DIRECT_OFFER'
                                                ? '直接オファー'
                                                : '立候補'}
                                            {' · '}
                                            {getRequestStatusLabel(
                                                request.status,
                                            )}
                                        </p>

                                        {canWithdraw && (
                                            <button
                                                type="button"
                                                disabled={
                                                    isActionPending
                                                }
                                                onClick={() => {
                                                    cancelMutation.reset()
                                                    withdrawMutation.reset()

                                                    setConfirmation({
                                                        action:
                                                            'WITHDRAW_RESPONSE',
                                                        coverageRequestId:
                                                            request.id,
                                                    })
                                                }}
                                                className="mt-5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                                            >
                                                {withdrawMutation
                                                    .isPending
                                                    ? '処理中...'
                                                    : '回答を取り下げる'}
                                            </button>
                                        )}
                                    </article>
                                )
                            },
                        )}
                    </div>
                )}
            </section>
            {confirmation && (
                <CoverageActionConfirmation
                    title={
                        confirmation.action ===
                            'CANCEL_REQUEST'
                            ? '交代依頼をキャンセル'
                            : '回答を取り下げる'
                    }
                    message={
                        confirmation.action ===
                            'CANCEL_REQUEST'
                            ? 'この交代依頼をキャンセルします。キャンセル後は募集や確認処理が終了します。'
                            : 'この交代募集への回答を取り下げます。よろしいですか？'
                    }
                    confirmLabel={
                        confirmation.action ===
                            'CANCEL_REQUEST'
                            ? '依頼をキャンセル'
                            : '回答を取り下げる'
                    }
                    isPending={
                        isActionPending
                    }
                    onCancel={() => {
                        setConfirmation(null)
                    }}
                    onConfirm={() => {
                        if (
                            confirmation.action ===
                            'CANCEL_REQUEST'
                        ) {
                            cancelMutation.mutate(
                                confirmation
                                    .coverageRequestId,
                                {
                                    onSettled: () => {
                                        setConfirmation(null)
                                    },
                                },
                            )

                            return
                        }

                        withdrawMutation.mutate(
                            confirmation
                                .coverageRequestId,
                            {
                                onSettled: () => {
                                    setConfirmation(null)
                                },
                            },
                        )
                    }}
                />
            )}
        </section>
    )
}