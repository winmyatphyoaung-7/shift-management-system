import {
  useState,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router'

import { useChangePassword } from '../features/auth/auth-hooks.ts'
import { toApiError } from '../lib/api-error.ts'

type PasswordFieldProps = {
  id: string
  label: string
  autoComplete: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  value,
  onChange,
}: PasswordFieldProps) {
  return (
    <div>
      <label
        className="block text-sm font-semibold text-slate-700"
        htmlFor={id}
      >
        {label}
      </label>

      <input
        id={id}
        name={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        placeholder={placeholder}
        className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  )
}

function getChangePasswordErrorMessage(
  errorCode: string,
): string {
  switch (errorCode) {
    case 'INVALID_CURRENT_PASSWORD':
      return '現在のパスワードが正しくありません。'

    case 'VALIDATION_ERROR':
      return '入力内容を確認してください。'

    case 'NETWORK_ERROR':
      return 'サーバーに接続できません。しばらくしてからもう一度お試しください。'

    case 'REQUEST_TIMEOUT':
      return 'サーバーからの応答に時間がかかっています。もう一度お試しください。'

    default:
      return 'パスワードの変更に失敗しました。もう一度お試しください。'
  }
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const changePasswordMutation =
    useChangePassword()

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState('')
  const [
    newPassword,
    setNewPassword,
  ] = useState('')
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')
  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setErrorMessage(null)

    if (!currentPassword) {
      setErrorMessage(
        '現在のパスワードを入力してください。',
      )
      return
    }

    if (newPassword.length < 12) {
      setErrorMessage(
        '新しいパスワードは12文字以上で入力してください。',
      )
      return
    }

    const newPasswordByteLength =
      new TextEncoder()
        .encode(newPassword)
        .byteLength

    if (newPasswordByteLength > 72) {
      setErrorMessage(
        '新しいパスワードは72バイト以内で入力してください。',
      )
      return
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setErrorMessage(
        '確認用パスワードが一致しません。',
      )
      return
    }

    if (
      currentPassword ===
      newPassword
    ) {
      setErrorMessage(
        '新しいパスワードは現在のパスワードと異なるものを入力してください。',
      )
      return
    }

    try {
      const member =
        await changePasswordMutation.mutateAsync({
          currentPassword,
          newPassword,
          confirmPassword,
        })

      navigate(
        member.role === 'MANAGER'
          ? '/manager'
          : '/schedule',
        {
          replace: true,
        },
      )
    } catch (error) {
      const apiError =
        toApiError(error)

      if (
        apiError.code ===
        'UNAUTHORIZED'
      ) {
        navigate('/login', {
          replace: true,
        })
        return
      }

      setErrorMessage(
        getChangePasswordErrorMessage(
          apiError.code,
        ),
      )
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:grid lg:place-items-center">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-10">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
          S
        </div>

        <p className="mt-8 text-sm font-semibold text-blue-600">
          セキュリティ設定
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          パスワード変更
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          安全に利用するため、新しいパスワードを設定してください。
        </p>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-900">
            パスワードの条件
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-blue-800">
            <li>12文字以上</li>
            <li>72バイト以内</li>
            <li>現在のパスワードとは異なるもの</li>
          </ul>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <PasswordField
            id="currentPassword"
            label="現在のパスワード"
            autoComplete="current-password"
            placeholder="現在のパスワード"
            value={currentPassword}
            onChange={setCurrentPassword}
          />

          <PasswordField
            id="newPassword"
            label="新しいパスワード"
            autoComplete="new-password"
            placeholder="12文字以上"
            value={newPassword}
            onChange={setNewPassword}
          />

          <PasswordField
            id="confirmPassword"
            label="新しいパスワード（確認）"
            autoComplete="new-password"
            placeholder="もう一度入力"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />

          {errorMessage && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={
              changePasswordMutation
                .isPending
            }
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {changePasswordMutation
              .isPending
              ? '変更中...'
              : 'パスワードを変更'}
          </button>
        </form>
      </section>
    </main>
  )
}