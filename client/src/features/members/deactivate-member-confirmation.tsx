import { toApiError } from '../../lib/api-error.ts'
import { useDeactivateMember } from './member-hooks.ts'
import type { StoreMember } from './member-types.ts'

type DeactivateMemberConfirmationProps = {
  member: StoreMember
  onCancel: () => void
  onDeactivated: (
    member: StoreMember,
  ) => void
}

type FutureShiftDetails = {
  scheduleDate: string
  scheduleStatus?: string
}

function getFutureShiftDetails(
  details: unknown,
): FutureShiftDetails | null {
  if (
    typeof details !== 'object' ||
    details === null
  ) {
    return null
  }

  const record =
    details as Record<string, unknown>

  if (
    typeof record.scheduleDate !==
    'string'
  ) {
    return null
  }

  return {
    scheduleDate: record.scheduleDate,
    scheduleStatus:
      typeof record.scheduleStatus ===
      'string'
        ? record.scheduleStatus
        : undefined,
  }
}

export function DeactivateMemberConfirmation({
  member,
  onCancel,
  onDeactivated,
}: DeactivateMemberConfirmationProps) {
  const deactivateMemberMutation =
    useDeactivateMember()

  const apiError =
    deactivateMemberMutation.isError
      ? toApiError(
          deactivateMemberMutation.error,
        )
      : null

  const futureShiftDetails =
    apiError?.code ===
    'MEMBER_HAS_FUTURE_SHIFTS'
      ? getFutureShiftDetails(
          apiError.details,
        )
      : null

  function handleDeactivate() {
    deactivateMemberMutation.mutate(
      {
        memberId: member.id,
      },
      {
        onSuccess: () => {
          onDeactivated(member)
        },
      },
    )
  }

  return (
    <section
      aria-labelledby="deactivate-member-title"
      className="mt-8 rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-red-600">
            DEACTIVATE MEMBER
          </p>

          <h2
            id="deactivate-member-title"
            className="mt-2 text-2xl font-bold text-slate-950"
          >
            スタッフを無効化
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {member.name}
            さん（ログインID：
            {member.loginId}）を無効化します。
          </p>
        </div>

        <button
          type="button"
          disabled={
            deactivateMemberMutation.isPending
          }
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          閉じる
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-800">
        <p className="font-semibold">
          この操作を実行しますか？
        </p>

        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            このスタッフはログインできなくなります。
          </li>
          <li>
            新しいシフトを割り当てられなくなります。
          </li>
          <li>
            メンバーとシフトの履歴は削除されません。
          </li>
          <li>
            現在、この画面から再有効化することはできません。
          </li>
        </ul>
      </div>

      {apiError && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
        >
          {apiError.code ===
          'MEMBER_HAS_FUTURE_SHIFTS' ? (
            <>
              <p>
                将来の有効なシフトがあるため、このスタッフを無効化できません。
              </p>

              {futureShiftDetails && (
                <p className="mt-1 font-semibold">
                  対象日：
                  {
                    futureShiftDetails.scheduleDate
                  }
                  {futureShiftDetails.scheduleStatus &&
                    `（${futureShiftDetails.scheduleStatus}）`}
                </p>
              )}
            </>
          ) : apiError.code ===
            'MEMBER_ALREADY_INACTIVE' ? (
            'このスタッフはすでに無効です。'
          ) : apiError.code ===
            'MANAGER_DEACTIVATION_NOT_ALLOWED' ? (
            'Managerを無効化することはできません。'
          ) : apiError.code ===
            'MEMBER_NOT_FOUND' ? (
            '対象のスタッフが見つかりません。'
          ) : (
            apiError.message
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          disabled={
            deactivateMemberMutation.isPending
          }
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          キャンセル
        </button>

        <button
          type="button"
          disabled={
            deactivateMemberMutation.isPending
          }
          onClick={handleDeactivate}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {deactivateMemberMutation.isPending
            ? '無効化中...'
            : '無効化する'}
        </button>
      </div>
    </section>
  )
}