import {
    useState,
    type FormEvent,
} from 'react'

import { toApiError } from '../../lib/api-error.ts'
import { useResetMemberPassword } from './member-hooks.ts'
import type {
    ResetMemberPasswordBody,
    StoreMember,
} from './member-types.ts'
import {
    validateResetMemberPasswordInput,
    type ResetMemberPasswordFieldErrors,
} from './member-validation.ts'

type ResetMemberPasswordFormProps = {
    member: StoreMember
    onCancel: () => void
    onReset: (
        member: StoreMember,
    ) => void
}

const inputClassName =
    'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

export function ResetMemberPasswordForm({
    member,
    onCancel,
    onReset,
}: ResetMemberPasswordFormProps) {
    const [input, setInput] =
        useState<ResetMemberPasswordBody>({
            temporaryPassword: '',
            confirmPassword: '',
        })

    const [
        fieldErrors,
        setFieldErrors,
    ] =
        useState<ResetMemberPasswordFieldErrors>(
            {},
        )

    const resetPasswordMutation =
        useResetMemberPassword()

    const apiError =
        resetPasswordMutation.isError
            ? toApiError(
                resetPasswordMutation.error,
            )
            : null

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const nextFieldErrors =
            validateResetMemberPasswordInput(
                input,
            )

        setFieldErrors(nextFieldErrors)

        if (
            Object.keys(nextFieldErrors)
                .length > 0
        ) {
            return
        }

        resetPasswordMutation.mutate(
            {
                memberId: member.id,
                body: input,
            },
            {
                onSuccess: () => {
                    onReset(member)
                },
            },
        )
    }

    return (
        <section className="mt-8 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-amber-600">
                        RESET PASSWORD
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                        仮パスワードを再設定
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        {member.name}
                        さんの仮パスワードを再設定します。
                    </p>
                </div>

                <button
                    type="button"
                    disabled={
                        resetPasswordMutation.isPending
                    }
                    onClick={onCancel}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                    閉じる
                </button>
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                再設定後、スタッフは次回ログイン時にパスワードを変更する必要があります。
            </div>

            {apiError && (
                <p
                    role="alert"
                    className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                    {apiError.code ===
                        'MEMBER_INACTIVE'
                        ? '無効なスタッフのパスワードは再設定できません。'
                        : apiError.code ===
                            'MANAGER_PASSWORD_RESET_NOT_ALLOWED'
                            ? 'Managerのパスワードはこの画面から再設定できません。'
                            : apiError.message}
                </p>
            )}

            <form
                noValidate
                onSubmit={handleSubmit}
                className="mt-8"
            >
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="reset-member-temporary-password"
                            className="text-sm font-semibold text-slate-700"
                        >
                            新しい仮パスワード
                        </label>

                        <input
                            id="reset-member-temporary-password"
                            type="password"
                            autoComplete="new-password"
                            value={
                                input.temporaryPassword
                            }
                            onChange={(event) => {
                                setInput((current) => ({
                                    ...current,
                                    temporaryPassword:
                                        event.target.value,
                                }))
                                setFieldErrors(
                                    (current) => ({
                                        ...current,
                                        temporaryPassword:
                                            undefined,
                                    }),
                                )
                                resetPasswordMutation.reset()
                            }}
                            aria-invalid={Boolean(
                                fieldErrors.temporaryPassword,
                            )}
                            aria-describedby={
                                fieldErrors.temporaryPassword
                                    ? 'reset-member-temporary-password-error'
                                    : 'reset-member-temporary-password-help'
                            }
                            className={inputClassName}
                        />

                        {fieldErrors.temporaryPassword ? (
                            <p
                                id="reset-member-temporary-password-error"
                                className="mt-2 text-sm text-red-600"
                            >
                                {
                                    fieldErrors.temporaryPassword
                                }
                            </p>
                        ) : (
                            <p
                                id="reset-member-temporary-password-help"
                                className="mt-2 text-xs text-slate-500"
                            >
                                12文字以上、UTF-8で72バイト以内
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="reset-member-confirm-password"
                            className="text-sm font-semibold text-slate-700"
                        >
                            仮パスワード（確認）
                        </label>

                        <input
                            id="reset-member-confirm-password"
                            type="password"
                            autoComplete="new-password"
                            value={input.confirmPassword}
                            onChange={(event) => {
                                setInput((current) => ({
                                    ...current,
                                    confirmPassword:
                                        event.target.value,
                                }))
                                setFieldErrors(
                                    (current) => ({
                                        ...current,
                                        confirmPassword:
                                            undefined,
                                    }),
                                )
                                resetPasswordMutation.reset()
                            }}
                            aria-invalid={Boolean(
                                fieldErrors.confirmPassword,
                            )}
                            aria-describedby={
                                fieldErrors.confirmPassword
                                    ? 'reset-member-confirm-password-error'
                                    : undefined
                            }
                            className={inputClassName}
                        />

                        {fieldErrors.confirmPassword && (
                            <p
                                id="reset-member-confirm-password-error"
                                className="mt-2 text-sm text-red-600"
                            >
                                {
                                    fieldErrors.confirmPassword
                                }
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
                    <button
                        type="button"
                        disabled={
                            resetPasswordMutation.isPending
                        }
                        onClick={onCancel}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                        キャンセル
                    </button>

                    <button
                        type="submit"
                        disabled={
                            resetPasswordMutation.isPending
                        }
                        className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
                    >
                        {resetPasswordMutation.isPending
                            ? '再設定中...'
                            : '仮パスワードを再設定'}
                    </button>
                </div>
            </form>
        </section>
    )
}