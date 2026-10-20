import { useState } from 'react'
import {
  useAcceptDirectOffer,
  useDeclineDirectOffer,
  usePublicCoverageRequests,
  useVolunteerForCoverageRequest,
  useWithdrawCoverageResponse,
} from '../features/coverage/coverage-hooks.ts'
import { CoverageActionConfirmation } from '../features/coverage/coverage-action-confirmation.tsx'
import type {
  CoverageCandidateStatus,
} from '../features/coverage/coverage-types.ts'
import { toApiError } from '../lib/api-error.ts'

type ResponseConfirmation = {
  action:
  | 'DECLINE_OFFER'
  | 'WITHDRAW_RESPONSE'
  coverageRequestId: string
}

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

function getCandidateStatusLabel(
  status: CoverageCandidateStatus,
): string {
  const labels: Record<
    CoverageCandidateStatus,
    string
  > = {
    PENDING: '回答待ち',
    AVAILABLE: '参加希望済み',
    DECLINED: '辞退済み',
    WITHDRAWN: '取り下げ済み',
    SELECTED: '選出されました',
    NOT_SELECTED: '今回は選出されませんでした',
    EXPIRED: '期限切れ',
  }

  return labels[status]
}

export function OpenReplacementsPage() {
  const [confirmation, setConfirmation,] = useState<ResponseConfirmation | null>(null)
  const coverageQuery =
    usePublicCoverageRequests()

  const volunteerMutation =
    useVolunteerForCoverageRequest()

  const withdrawMutation =
    useWithdrawCoverageResponse()

  const acceptMutation =
    useAcceptDirectOffer()

  const declineMutation =
    useDeclineDirectOffer()

  const actionMutations = [
    volunteerMutation,
    withdrawMutation,
    acceptMutation,
    declineMutation,
  ]

  const activeMutation =
    actionMutations.find(
      (mutation) =>
        mutation.isPending,
    )

  const failedMutation =
    actionMutations.find(
      (mutation) =>
        mutation.isError,
    )

  const actionError =
    failedMutation?.error
      ? toApiError(
        failedMutation.error,
      )
      : null

  function resetActionErrors() {
    actionMutations.forEach(
      (mutation) => {
        mutation.reset()
      },
    )
  }

  if (coverageQuery.isLoading) {
    return (
      <p className="text-sm text-slate-600">
        交代募集を読み込んでいます...
      </p>
    )
  }

  if (
    coverageQuery.isError ||
    !coverageQuery.data
  ) {
    const error = toApiError(
      coverageQuery.error,
    )

    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        交代募集を読み込めませんでした。
        {error.message}
      </p>
    )
  }

  const coverageRequests =
    coverageQuery.data

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold tracking-wide text-blue-600">
          OPEN REPLACEMENTS
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          交代募集中のシフト
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          対応できるシフトに立候補したり、
          直接オファーへ回答したりできます。
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

      {coverageRequests.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="font-semibold text-slate-700">
            現在、交代募集中のシフトはありません。
          </p>

          <p className="mt-2 text-sm text-slate-500">
            新しい募集があると、ここに表示されます。
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {coverageRequests.map(
            (request) => {
              const candidate =
                request.candidates[0]

              const isPending =
                Boolean(activeMutation)

              return (
                <article
                  key={request.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        {
                          request
                            .originalAssignee
                            .user.name
                        }
                        さんのシフト
                      </p>

                      <h2 className="mt-2 text-xl font-bold text-slate-950">
                        {formatDateTime(
                          request
                            .requestedStartAt,
                        )}
                        {' ～ '}
                        {formatDateTime(
                          request
                            .requestedEndAt,
                        )}
                      </h2>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      募集中
                    </span>
                  </div>

                  <dl className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">
                        募集期限
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        {formatDateTime(
                          request
                            .responseDeadline,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-slate-500">
                        自分の回答
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        {candidate
                          ? getCandidateStatusLabel(
                            candidate.status,
                          )
                          : '未回答'}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {!candidate && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          resetActionErrors()

                          volunteerMutation.mutate(
                            request.id,
                          )
                        }}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {volunteerMutation
                          .isPending
                          ? '処理中...'
                          : '立候補する'}
                      </button>
                    )}

                    {candidate?.type ===
                      'DIRECT_OFFER' &&
                      candidate.status ===
                      'PENDING' && (
                        <>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              resetActionErrors()

                              acceptMutation.mutate(
                                request.id,
                              )
                            }}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                          >
                            {acceptMutation
                              .isPending
                              ? '処理中...'
                              : 'オファーを承諾'}
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              resetActionErrors()

                              setConfirmation({
                                action: 'DECLINE_OFFER',
                                coverageRequestId:
                                  request.id,
                              })
                            }}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            辞退する
                          </button>
                        </>
                      )}

                    {candidate?.status ===
                      'AVAILABLE' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            resetActionErrors()

                            setConfirmation({
                              action:
                                'WITHDRAW_RESPONSE',
                              coverageRequestId:
                                request.id,
                            })
                          }}
                          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                        >
                          {withdrawMutation
                            .isPending
                            ? '処理中...'
                            : '回答を取り下げる'}
                        </button>
                      )}
                  </div>
                </article>
              )
            },
          )}
        </div>
      )}
      {confirmation && (
        <CoverageActionConfirmation
          title={
            confirmation.action ===
              'DECLINE_OFFER'
              ? 'オファーを辞退'
              : '回答を取り下げる'
          }
          message={
            confirmation.action ===
              'DECLINE_OFFER'
              ? 'この直接オファーを辞退します。よろしいですか？'
              : 'この交代募集への回答を取り下げます。よろしいですか？'
          }
          confirmLabel={
            confirmation.action ===
              'DECLINE_OFFER'
              ? '辞退する'
              : '回答を取り下げる'
          }
          isPending={
            Boolean(activeMutation)
          }
          onCancel={() => {
            setConfirmation(null)
          }}
          onConfirm={() => {
            if (
              confirmation.action ===
              'DECLINE_OFFER'
            ) {
              declineMutation.mutate(
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