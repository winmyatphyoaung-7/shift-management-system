import { toApiError } from '../../lib/api-error.ts'
import {
  useFinalApproveCoverageRequest,
} from './coverage-hooks.ts'
import type {
  ManagerCoverageCandidate,
  ManagerCoverageRequest,
} from './coverage-types.ts'

type FinalApproveCoverageConfirmationProps = {
  request: ManagerCoverageRequest
  candidate: ManagerCoverageCandidate
  onCancel: () => void
  onApproved: () => void
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
      '募集中の交代依頼のみ最終承認できます。',
    SHIFT_NOT_ACTIVE:
      '対象のシフトは有効ではありません。',
    SHIFT_ALREADY_STARTED:
      '開始済みのシフトは最終承認できません。',
    COVERAGE_CANDIDATE_NOT_FOUND:
      '選択した候補者が見つかりません。',
    COVERAGE_CANDIDATE_NOT_AVAILABLE:
      '対応可能と回答した候補者のみ選択できます。',
    COVERAGE_CANDIDATE_NOT_ELIGIBLE:
      '選択した候補者は現在対象外です。',
    CANNOT_SELECT_ORIGINAL_ASSIGNEE:
      '元の担当者を交代候補として選択できません。',
    COVERAGE_CANDIDATE_HAS_OVERLAPPING_SHIFT:
      '選択した候補者には重複するシフトがあります。',
    COVERAGE_REQUEST_STATE_CHANGED:
      '交代依頼の状態が変更されました。画面を更新して確認してください。',
    COVERAGE_CANDIDATE_STATE_CHANGED:
      '候補者の状態が変更されました。画面を更新して確認してください。',
    SHIFT_ASSIGNMENT_STATE_CHANGED:
      'シフトの担当状態が変更されました。画面を更新して確認してください。',
  }

  return (
    messages[code] ??
    fallbackMessage
  )
}

export function FinalApproveCoverageConfirmation({
  request,
  candidate,
  onCancel,
  onApproved,
}: FinalApproveCoverageConfirmationProps) {
  const approveMutation =
    useFinalApproveCoverageRequest()

  const apiError =
    approveMutation.isError
      ? toApiError(
          approveMutation.error,
        )
      : null

  const isPending =
    approveMutation.isPending

  function handleApprove() {
    approveMutation.mutate(
      {
        coverageRequestId:
          request.id,
        selectedCandidateId:
          candidate.id,
      },
      {
        onSuccess: () => {
          onApproved()
        },
      },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !isPending
        ) {
          onCancel()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="final-approve-title"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <p className="text-sm font-semibold tracking-wide text-emerald-600">
          FINAL APPROVAL
        </p>

        <h2
          id="final-approve-title"
          className="mt-2 text-2xl font-bold text-slate-950"
        >
          交代候補者を最終承認
        </h2>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          最終承認すると、対象シフトの担当者が選択した候補者へ変更されます。
        </p>

        <dl className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-5 text-sm">
          <div>
            <dt className="font-semibold text-slate-500">
              新しい担当者
            </dt>

            <dd className="mt-1 font-bold text-slate-950">
              {candidate.membership.user.name}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-slate-500">
              現在の担当者
            </dt>

            <dd className="mt-1 text-slate-800">
              {request.originalAssignee.user.name}
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-slate-500">
              対象時間
            </dt>

            <dd className="mt-1 text-slate-800">
              {formatDateTime(
                request.requestedStartAt,
              )}
              {' ～ '}
              {formatDateTime(
                request.requestedEndAt,
              )}
            </dd>
          </div>
        </dl>

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

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            戻る
          </button>

          <button
            type="button"
            disabled={
              isPending ||
              candidate.status !==
                'AVAILABLE'
            }
            onClick={handleApprove}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isPending
              ? '承認中...'
              : 'この候補者を最終承認'}
          </button>
        </div>
      </section>
    </div>
  )
}