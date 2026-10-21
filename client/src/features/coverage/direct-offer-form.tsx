import {
  useState,
  type FormEvent,
} from 'react'

import { useMembers } from '../members/member-hooks.ts'
import { toApiError } from '../../lib/api-error.ts'
import { useSendDirectOffers } from './coverage-hooks.ts'
import type {
  ManagerCoverageRequest,
} from './coverage-types.ts'

type DirectOfferFormProps = {
  request: ManagerCoverageRequest
  onClose: () => void
  onSent: (
    sentCount: number,
  ) => void
}

function formatDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'ja-JP',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  ).format(new Date(value))
}

function getApiErrorMessage(
  code: string,
  fallbackMessage: string,
): string {
  const messages: Record<
    string,
    string
  > = {
    COVERAGE_REQUEST_NOT_FOUND:
      '交代依頼が見つかりません。',
    COVERAGE_REQUEST_NOT_OPEN:
      '募集中の交代依頼にのみ直接依頼を送信できます。',
    SHIFT_NOT_ACTIVE:
      '対象のシフトは有効ではありません。',
    SHIFT_ALREADY_STARTED:
      '開始済みのシフトには直接依頼を送信できません。',
    RESPONSE_DEADLINE_PASSED:
      '回答期限を過ぎています。期限を延長してから再度お試しください。',
    CANNOT_OFFER_ORIGINAL_ASSIGNEE:
      '元の担当者には直接依頼を送信できません。',
    DIRECT_OFFER_MEMBER_NOT_ELIGIBLE:
      '選択したスタッフの中に、直接依頼の対象外となるメンバーがいます。',
    COVERAGE_RESPONSE_ALREADY_EXISTS:
      '選択したスタッフの中に、すでに回答または候補登録があるメンバーがいます。',
    DIRECT_OFFER_MEMBER_HAS_OVERLAPPING_SHIFT:
      '選択したスタッフの中に、対象時間と重複するシフトがあるメンバーがいます。',
  }

  return (
    messages[code] ??
    fallbackMessage
  )
}

export function DirectOfferForm({
  request,
  onClose,
  onSent,
}: DirectOfferFormProps) {
  const [
    selectedMembershipIds,
    setSelectedMembershipIds,
  ] = useState<string[]>([])

  const [
    fieldError,
    setFieldError,
  ] = useState<string | null>(null)

  const membersQuery =
    useMembers()

  const sendMutation =
    useSendDirectOffers()

  const existingCandidateMembershipIds =
    new Set(
      request.candidates.map(
        (candidate) =>
          candidate.membership.id,
      ),
    )

  const eligibleMembers =
    (membersQuery.data ?? [])
      .filter(
        (member) =>
          member.role === 'STAFF' &&
          member.status === 'ACTIVE' &&
          member.id !==
            request.originalAssignee.id &&
          !existingCandidateMembershipIds.has(
            member.id,
          ),
      )
      .sort((first, second) =>
        first.name.localeCompare(
          second.name,
          'ja',
        ),
      )

  const apiError =
    sendMutation.isError
      ? toApiError(
          sendMutation.error,
        )
      : null

  function toggleMember(
    membershipId: string,
  ) {
    setSelectedMembershipIds(
      (current) =>
        current.includes(
          membershipId,
        )
          ? current.filter(
              (id) =>
                id !== membershipId,
            )
          : [
              ...current,
              membershipId,
            ],
    )

    setFieldError(null)
    sendMutation.reset()
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    sendMutation.reset()
    setFieldError(null)

    if (
      selectedMembershipIds.length === 0
    ) {
      setFieldError(
        '直接依頼を送るスタッフを1人以上選択してください。',
      )
      return
    }

    sendMutation.mutate(
      {
        coverageRequestId:
          request.id,
        membershipIds:
          selectedMembershipIds,
      },
      {
        onSuccess: (candidates) => {
          onSent(
            candidates.length,
          )
        },
      },
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="direct-offer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-violet-600">
              DIRECT OFFER
            </p>

            <h2
              id="direct-offer-title"
              className="mt-2 text-2xl font-bold text-slate-950"
            >
              スタッフへ直接依頼
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {
                request
                  .originalAssignee
                  .user.name
              }
              さんのシフト
              <br />
              {formatDateTime(
                request.requestedStartAt,
              )}
              {' 〜 '}
              {formatDateTime(
                request.requestedEndAt,
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={
              sendMutation.isPending
            }
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            閉じる
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          回答期限：
          <span className="font-semibold text-slate-900">
            {request.responseDeadline
              ? formatDateTime(
                  request.responseDeadline,
                )
              : '未設定'}
          </span>
        </div>

        {apiError && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {getApiErrorMessage(
              apiError.code,
              apiError.message,
            )}
          </p>
        )}

        {membersQuery.isError && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {
              toApiError(
                membersQuery.error,
              ).message
            }
          </p>
        )}

        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                依頼先スタッフ
              </p>

              <p className="mt-1 text-xs text-slate-500">
                選択中：
                {
                  selectedMembershipIds
                    .length
                }
                人
              </p>
            </div>

            {eligibleMembers.length >
              0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    sendMutation.isPending
                  }
                  onClick={() => {
                    setSelectedMembershipIds(
                      eligibleMembers.map(
                        (member) =>
                          member.id,
                      ),
                    )
                    setFieldError(null)
                    sendMutation.reset()
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  全員選択
                </button>

                <button
                  type="button"
                  disabled={
                    sendMutation.isPending
                  }
                  onClick={() => {
                    setSelectedMembershipIds(
                      [],
                    )
                    setFieldError(null)
                    sendMutation.reset()
                  }}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  選択解除
                </button>
              </div>
            )}
          </div>

          {membersQuery.isPending ? (
            <p
              role="status"
              className="mt-4 text-sm text-slate-600"
            >
              スタッフを読み込んでいます...
            </p>
          ) : eligibleMembers.length ===
            0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
              <p className="font-semibold text-slate-800">
                依頼可能なスタッフがいません
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                元の担当者、無効なスタッフ、すでに候補登録されているスタッフは表示されません。
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {eligibleMembers.map(
                (member) => {
                  const isSelected =
                    selectedMembershipIds
                      .includes(
                        member.id,
                      )

                  return (
                    <label
                      key={member.id}
                      className={[
                        'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition',
                        isSelected
                          ? 'border-violet-400 bg-violet-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        checked={
                          isSelected
                        }
                        disabled={
                          sendMutation.isPending
                        }
                        onChange={() => {
                          toggleMember(
                            member.id,
                          )
                        }}
                        className="size-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {member.name}
                        </span>

                        <span className="mt-1 block truncate text-xs text-slate-500">
                          ID: {member.loginId}
                        </span>
                      </span>
                    </label>
                  )
                },
              )}
            </div>
          )}

          {fieldError && (
            <p
              role="alert"
              className="mt-5 text-sm font-medium text-red-600"
            >
              {fieldError}
            </p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={
                sendMutation.isPending
              }
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              キャンセル
            </button>

            <button
              type="submit"
              disabled={
                sendMutation.isPending ||
                membersQuery.isPending ||
                eligibleMembers.length ===
                  0
              }
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
            >
              {sendMutation.isPending
                ? '送信中...'
                : `${selectedMembershipIds.length}人へ直接依頼`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}