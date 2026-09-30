import {
    useState,
    type FormEvent,
} from 'react'

import { toApiError } from '../../lib/api-error.ts'
import { useUpdateMember } from './member-hooks.ts'
import {
    MEMBER_COLOR_KEYS,
    type MemberColorKey,
    type StoreMember,
} from './member-types.ts'
import {
    buildUpdateMemberBody,
    validateEditMemberInput,
    type EditMemberFieldErrors,
    type EditMemberInput,
} from './member-validation.ts'

type EditMemberFormProps = {
    member: StoreMember
    onCancel: () => void
    onUpdated: (
        member: StoreMember,
    ) => void
}

const inputClassName =
    'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

export function EditMemberForm({
    member,
    onCancel,
    onUpdated,
}: EditMemberFormProps) {
    const [input, setInput] =
        useState<EditMemberInput>({
            name: member.name,
            loginId: member.loginId,
            colorKey: member.colorKey,
        })

    const [
        fieldErrors,
        setFieldErrors,
    ] =
        useState<EditMemberFieldErrors>(
            {},
        )

    const [
        formMessage,
        setFormMessage,
    ] = useState<string | null>(null)

    const updateMemberMutation =
        useUpdateMember()

    const apiError =
        updateMemberMutation.isError
            ? toApiError(
                updateMemberMutation.error,
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
            validateEditMemberInput(
                normalizedInput,
            )

        setFieldErrors(nextFieldErrors)
        setFormMessage(null)

        if (
            Object.keys(nextFieldErrors)
                .length > 0
        ) {
            return
        }

        const body =
            buildUpdateMemberBody(
                member,
                normalizedInput,
            )

        if (Object.keys(body).length === 0) {
            setFormMessage(
                '変更された項目がありません。',
            )
            return
        }

        updateMemberMutation.mutate(
            {
                memberId: member.id,
                body,
            },
            {
                onSuccess: (updatedMember) => {
                    onUpdated(updatedMember)
                },
            },
        )
    }

    return (
        <section className="mt-8 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-blue-600">
                        EDIT MEMBER
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                        メンバーを編集
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        {member.name}
                        さんの氏名、ログインID、表示色を変更します。
                    </p>
                </div>

                <button
                    type="button"
                    disabled={
                        updateMemberMutation.isPending
                    }
                    onClick={onCancel}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                    閉じる
                </button>
            </div>

            {formMessage && (
                <p
                    role="status"
                    className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
                >
                    {formMessage}
                </p>
            )}

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
                            htmlFor="edit-member-name"
                            className="text-sm font-semibold text-slate-700"
                        >
                            氏名
                        </label>

                        <input
                            id="edit-member-name"
                            type="text"
                            autoComplete="name"
                            maxLength={100}
                            value={input.name}
                            onChange={(event) => {
                                setInput((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                                setFormMessage(null)
                            }}
                            aria-invalid={
                                Boolean(fieldErrors.name)
                            }
                            aria-describedby={
                                fieldErrors.name
                                    ? 'edit-member-name-error'
                                    : undefined
                            }
                            className={inputClassName}
                        />

                        {fieldErrors.name && (
                            <p
                                id="edit-member-name-error"
                                className="mt-2 text-sm text-red-600"
                            >
                                {fieldErrors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="edit-member-login-id"
                            className="text-sm font-semibold text-slate-700"
                        >
                            ログインID
                        </label>

                        <input
                            id="edit-member-login-id"
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
                                setFormMessage(null)
                            }}
                            aria-invalid={
                                Boolean(
                                    fieldErrors.loginId,
                                )
                            }
                            aria-describedby={
                                fieldErrors.loginId
                                    ? 'edit-member-login-id-error'
                                    : 'edit-member-login-id-help'
                            }
                            className={inputClassName}
                        />

                        {fieldErrors.loginId ? (
                            <p
                                id="edit-member-login-id-error"
                                className="mt-2 text-sm text-red-600"
                            >
                                {fieldErrors.loginId}
                            </p>
                        ) : (
                            <p
                                id="edit-member-login-id-help"
                                className="mt-2 text-xs text-slate-500"
                            >
                                先頭の0を含む3桁の数字
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label
                            htmlFor="edit-member-color"
                            className="text-sm font-semibold text-slate-700"
                        >
                            表示色
                        </label>

                        <select
                            id="edit-member-color"
                            value={input.colorKey}
                            onChange={(event) => {
                                setInput((current) => ({
                                    ...current,
                                    colorKey:
                                        event.target
                                            .value as MemberColorKey,
                                }))
                                setFormMessage(null)
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
                            updateMemberMutation.isPending
                        }
                        onClick={onCancel}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                        キャンセル
                    </button>

                    <button
                        type="submit"
                        disabled={
                            updateMemberMutation.isPending
                        }
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {updateMemberMutation.isPending
                            ? '更新中...'
                            : '変更を保存'}
                    </button>
                </div>
            </form>
        </section>
    )
}