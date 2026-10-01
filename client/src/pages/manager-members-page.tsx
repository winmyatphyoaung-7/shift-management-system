import { useState } from 'react'

import { CreateMemberForm } from '../features/members/create-member-form.tsx'
import { EditMemberForm } from '../features/members/edit-member-form.tsx'
import { ResetMemberPasswordForm } from '../features/members/reset-member-password-form.tsx'
import { DeactivateMemberConfirmation } from '../features/members/deactivate-member-confirmation.tsx'
import { useMembers } from '../features/members/member-hooks.ts'
import type { StoreMember } from '../features/members/member-types.ts'
import { toApiError } from '../lib/api-error.ts'


const memberColorClasses: Record<
  string,
  string
> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
  zinc: 'bg-zinc-500',
  stone: 'bg-stone-500',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    'ja-JP',
    {
      dateStyle: 'medium',
    },
  ).format(new Date(value))
}

export function ManagerMembersPage() {
  const [
    isCreateFormOpen,
    setIsCreateFormOpen,
  ] = useState(false)

  const [
    createdMemberName,
    setCreatedMemberName,
  ] = useState<string | null>(null)

  const [
    selectedMember,
    setSelectedMember,
  ] = useState<StoreMember | null>(
    null,
  )

  const [
    updatedMemberName,
    setUpdatedMemberName,
  ] = useState<string | null>(null)

  const [
    passwordResetMember,
    setPasswordResetMember,
  ] = useState<StoreMember | null>(
    null,
  )

  const [
    resetPasswordMemberName,
    setResetPasswordMemberName,
  ] = useState<string | null>(null)

  const [
    memberToDeactivate,
    setMemberToDeactivate,
  ] = useState<StoreMember | null>(
    null,
  )

  const [
    deactivatedMemberName,
    setDeactivatedMemberName,
  ] = useState<string | null>(null)

  const {
    data: members,
    error,
    isError,
    isFetching,
    isPending,
    refetch,
  } = useMembers()

  if (isPending) {
    return (
      <section
        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        aria-busy="true"
      >
        <div
          className="flex items-center gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="size-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="font-medium text-slate-600">
            メンバーを読み込んでいます...
          </p>
        </div>
      </section>
    )
  }

  if (isError) {
    const apiError = toApiError(error)

    return (
      <section className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-red-600">
          読み込みエラー
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          メンバーを取得できませんでした
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {apiError.message}
        </p>

        <button
          type="button"
          disabled={isFetching}
          onClick={() => {
            void refetch()
          }}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isFetching
            ? '再読み込み中...'
            : 'もう一度試す'}
        </button>
      </section>
    )
  }

  const activeMemberCount =
    members.filter(
      (member) =>
        member.status === 'ACTIVE',
    ).length

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-600">
            TEAM
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            スタッフ管理
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            店舗メンバーのアカウントと利用状態を確認できます。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <button
            type="button"
            disabled={isCreateFormOpen}
            onClick={() => {
              setSelectedMember(null)
              setPasswordResetMember(null)
              setCreatedMemberName(null)
              setUpdatedMemberName(null)
              setResetPasswordMemberName(null)
              setIsCreateFormOpen(true)
              setMemberToDeactivate(null)
              setDeactivatedMemberName(null)
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            スタッフを追加
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">
              全メンバー
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {members.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">
              有効
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {activeMemberCount}
            </p>
          </div>
        </div>
      </div>

      {createdMemberName && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {createdMemberName}
          さんのStaffアカウントを作成しました。
        </p>
      )}

      {updatedMemberName && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {updatedMemberName}
          さんの情報を更新しました。
        </p>
      )}

      {resetPasswordMemberName && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {resetPasswordMemberName}
          さんの仮パスワードを再設定しました。
        </p>
      )}

      {deactivatedMemberName && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {deactivatedMemberName}
          さんを無効化しました。
        </p>
      )}

      {isCreateFormOpen && (
        <CreateMemberForm
          onCancel={() => {
            setIsCreateFormOpen(false)
          }}
          onCreated={(member) => {
            setIsCreateFormOpen(false)
            setCreatedMemberName(
              member.name,
            )
          }}
        />
      )}

      {selectedMember && (
        <EditMemberForm
          key={selectedMember.id}
          member={selectedMember}
          onCancel={() => {
            setSelectedMember(null)
          }}
          onUpdated={(member) => {
            setSelectedMember(null)
            setUpdatedMemberName(
              member.name,
            )
          }}
        />
      )}

      {passwordResetMember && (
        <ResetMemberPasswordForm
          key={passwordResetMember.id}
          member={passwordResetMember}
          onCancel={() => {
            setPasswordResetMember(null)
          }}
          onReset={(member) => {
            setPasswordResetMember(null)
            setResetPasswordMemberName(
              member.name,
            )
          }}
        />
      )}

      {memberToDeactivate && (
        <DeactivateMemberConfirmation
          key={memberToDeactivate.id}
          member={memberToDeactivate}
          onCancel={() => {
            setMemberToDeactivate(null)
          }}
          onDeactivated={(member) => {
            setMemberToDeactivate(null)
            setDeactivatedMemberName(
              member.name,
            )
          }}
        />
      )}

      {members.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-bold text-slate-950">
            メンバーが登録されていません
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            スタッフを追加すると、ここに表示されます。
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    メンバー
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    ログインID
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    権限
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    状態
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    パスワード
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    更新日
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    操作
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            'size-3 rounded-full',
                            memberColorClasses[
                            member.colorKey
                            ] ??
                            'bg-slate-400',
                          ].join(' ')}
                          aria-hidden="true"
                        />

                        <div>
                          <p className="font-semibold text-slate-950">
                            {member.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {member.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-slate-700">
                      {member.loginId}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {member.role ===
                          'MANAGER'
                          ? 'Manager'
                          : 'Staff'}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={[
                          'rounded-full px-3 py-1 text-xs font-semibold',
                          member.status ===
                            'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600',
                        ].join(' ')}
                      >
                        {member.status ===
                          'ACTIVE'
                          ? '有効'
                          : '無効'}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {member.mustChangePassword
                        ? '変更が必要'
                        : '設定済み'}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(
                        member.updatedAt,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreateFormOpen(false)
                            setPasswordResetMember(null)
                            setCreatedMemberName(null)
                            setUpdatedMemberName(null)
                            setResetPasswordMemberName(null)
                            setSelectedMember(member)
                            setMemberToDeactivate(null)
                            setDeactivatedMemberName(null)
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          編集
                        </button>

                        {member.role === 'STAFF' &&
                          member.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreateFormOpen(false)
                                setSelectedMember(null)
                                setCreatedMemberName(null)
                                setUpdatedMemberName(null)
                                setResetPasswordMemberName(
                                  null,
                                )
                                setPasswordResetMember(
                                  member,
                                )
                                setMemberToDeactivate(null)
                                setDeactivatedMemberName(null)
                              }}
                              className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                            >
                              パスワード再設定
                            </button>
                          )}
                        {member.role === 'STAFF' &&
                          member.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreateFormOpen(false)
                                setSelectedMember(null)
                                setPasswordResetMember(null)
                                setCreatedMemberName(null)
                                setUpdatedMemberName(null)
                                setResetPasswordMemberName(
                                  null,
                                )
                                setDeactivatedMemberName(
                                  null,
                                )
                                setMemberToDeactivate(
                                  member,
                                )
                              }}
                              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                            >
                              無効化
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}