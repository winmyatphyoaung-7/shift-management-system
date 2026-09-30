import {
    useState,
    type FormEvent,
} from 'react'

import { toApiError } from '../../lib/api-error.ts'
import { useCreateMember } from './member-hooks.ts'
import {
    MEMBER_COLOR_KEYS,
    type CreateMemberInput,
    type MemberColorKey,
    type StoreMember,
} from './member-types.ts'
import {
    validateCreateMemberInput,
    type CreateMemberFieldErrors,
} from './member-validation.ts'

type CreateMemberFormProps = {
    onCancel: () => void
    onCreated: (
        member: StoreMember,
    ) => void
}

const initialInput: CreateMemberInput = {
    name: '',
    loginId: '',
    temporaryPassword: '',
    confirmPassword: '',
    colorKey: 'blue',
}

const inputClassName =
    'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

export function CreateMemberForm({
    onCancel,
    onCreated,
}: CreateMemberFormProps) {
    const [input, setInput] =
        useState<CreateMemberInput>(
            initialInput,
        )

    const [
        fieldErrors,
        setFieldErrors,
    ] =
        useState<CreateMemberFieldErrors>(
            {},
        )

    const createMemberMutation =
        useCreateMember()

    const apiError =
        createMemberMutation.isError
            ? toApiError(
                createMemberMutation.error,
            )
            : null

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const normalizedInput = {
            ...input,
            name: input.name.trim(),
        }

        const nextFieldErrors =
            validateCreateMemberInput(
                normalizedInput,
            )

        setFieldErrors(nextFieldErrors)

        if (
            Object.keys(nextFieldErrors)
                .length > 0
        ) {
            return
        }

        createMemberMutation.mutate(
            normalizedInput,
            {
                onSuccess: (member) => {
                    onCreated(member)
                },
            },
        )
    }

    return (
        <section className="mt-8 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-blue-600">
                        NEW STAFF
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                        スタッフを追加
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        初回ログイン時にパスワード変更が必要なStaffアカウントを作成します。
                    </p>
                </div>

                <button
                    type="button"
                    disabled={
                        createMemberMutation.isPending
                    }
                    onClick={onCancel}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                    閉じる
                </button>
            </div>

            {apiError && (
                <p
                    role="alert"
                    className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                    {apiError.code ===
                        'LOGIN_ID_ALREADY_EXISTS'
                        ? 'このログインIDはすでに使用されています。'
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
                            htmlFor="member-name"
                            className="text-sm font-semibold text-slate-700"
                        >
                            氏名
                        </label>

                        <input
                            id="member-name"
                            type="text"
                            autoComplete="name"
                            maxLength={100}
                            value={input.name}
                            onChange={(event) => {
                                setInput((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }}
                            aria-invalid={
                                Boolean(fieldErrors.name)
                            }
                            aria-describedby={
                                fieldErrors.name
                                    ? 'member-name-error'
                                    : undefined
                            }
                            placeholder="例：山田 太郎"
                            className={inputClassName}
                        />

                        {fieldErrors.name && (
                            <p
                                id="member-name-error"
                                className="mt-2 text-sm text-red-600"
                            >
                                {fieldErrors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="member-login-id"
                            className="text-sm font-semibold text-slate-700"
                        >
                            ログインID
                        </label>

                        <input
                            id="member-login-id"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={3}
                            value={input.loginId}
                            onChange={(event) => {
                                setInput((current) => ({
                                    ...current,
                                    loginId:
                                        event.target.value,
                                }))
                            }}
                            aria-invalid={
                                Boolean(
                                    fieldErrors.loginId,
                                )
                            }
                            aria-describedby={
                                fieldErrors.loginId
                                    ? 'member-login-id-error'
                                    : 'member-login-id-help'
                            }
                            placeholder="例：004"
                            className={inputClassName}
                        />

                        {fieldErrors.loginId ? (
                            <p
                                id="member-login-id-error"
                                className="mt-2 text-sm text-red-600"
                            >
                                {fieldErrors.loginId}
                            </p>
                        ) : (
                            <p
                                id="member-login-id-help"
                                className="mt-2 text-xs text-slate-500"
                            >
                                先頭の0を含む3桁の数字
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="member-temporary-password"
                            className="text-sm font-semibold text-slate-700"
                        >
                            仮パスワード
                        </label>

                        <input
                            id="member-temporary-password"
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
                            }}
                            aria-invalid={
                                Boolean(
                                    fieldErrors.temporaryPassword,
                                )
                            }
                            aria-describedby={
                                fieldErrors.temporaryPassword
                                    ? 'member-temporary-password-error'
                                    : 'member-temporary-password-help'
                            }
                            className={inputClassName}
                        />

                        {fieldErrors.temporaryPassword ? (
                            <p
                                id="member-temporary-password-error"
                                className="mt-2 text-sm text-red-600"
                            >
                                {
                                    fieldErrors.temporaryPassword
                                }
                            </p>
                        ) : (
                            <p
                                id="member-temporary-password-help"
                                className="mt-2 text-xs text-slate-500"
                            >
                                12文字以上・UTF-8で72バイト以内
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="member-confirm-password"
                            className="text-sm font-semibold text-slate-700"
                        >
                            仮パスワード（確認）
                        </label>

                        <input
                            id="member-confirm-password"
                            type="password"
                            autoComplete="new-password"
                            value={input.confirmPassword}
                            onChange={(event) => {
                                setInput((current) => ({
                                    ...current,
                                    confirmPassword:
                                        event.target.value,
                                }))
                            }}
                            aria-invalid={
                                Boolean(
                                    fieldErrors.confirmPassword,
                                )
                            }
                            aria-describedby={
                                fieldErrors.confirmPassword
                                    ? 'member-confirm-password-error'
                                    : undefined
                            }
                            className={inputClassName}
                        />

                        {fieldErrors.confirmPassword && (
                            <p
                                id="member-confirm-password-error"
                                className="mt-2 text-sm text-red-600"
                            >
                                {
                                    fieldErrors.confirmPassword
                                }
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label
                            htmlFor="member-color"
                            className="text-sm font-semibold text-slate-700"
                        >
                            表示色
                        </label>

                        <select
                            id="member-color"
                            value={input.colorKey}
                            onChange={(event) => {
                                setInput((current) => ({
                                    ...current,
                                    colorKey:
                                        event.target
                                            .value as MemberColorKey,
                                }))
                            }}
                            className={inputClassName}
                        >
                            {MEMBER_COLOR_KEYS.map(
                                (colorKey) => (
                                    <option
                                        key={colorKey}
                                        value={colorKey}
                                    >
                                        {colorKey}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
                    <button
                        type="button"
                        disabled={
                            createMemberMutation.isPending
                        }
                        onClick={onCancel}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                        キャンセル
                    </button>

                    <button
                        type="submit"
                        disabled={
                            createMemberMutation.isPending
                        }
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {createMemberMutation.isPending
                            ? '作成中...'
                            : 'スタッフを作成'}
                    </button>
                </div>
            </form>
        </section>
    )
}