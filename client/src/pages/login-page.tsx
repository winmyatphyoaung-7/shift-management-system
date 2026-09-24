import {
  useState,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router'

import { useLogin } from '../features/auth/auth-hooks.ts'
import { toApiError } from '../lib/api-error.ts'

function getLoginErrorMessage(
  errorCode: string,
): string {
  switch (errorCode) {
    case 'INVALID_CREDENTIALS':
      return 'ログインIDまたはパスワードが正しくありません。'

    case 'NETWORK_ERROR':
      return 'サーバーに接続できません。しばらくしてからもう一度お試しください。'

    case 'REQUEST_TIMEOUT':
      return 'サーバーからの応答に時間がかかっています。もう一度お試しください。'

    default:
      return 'ログインに失敗しました。もう一度お試しください。'
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()

  const [loginId, setLoginId] =
    useState('')
  const [password, setPassword] =
    useState('')
  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setErrorMessage(null)

    if (!/^\d{3}$/.test(loginId)) {
      setErrorMessage(
        'ログインIDは3桁の数字で入力してください。',
      )
      return
    }

    if (!password) {
      setErrorMessage(
        'パスワードを入力してください。',
      )
      return
    }

    try {
      const member =
        await loginMutation.mutateAsync({
          loginId,
          password,
        })

      if (member.mustChangePassword) {
        navigate(
          '/change-password',
          {
            replace: true,
          },
        )
        return
      }

      navigate(
        member.role === 'MANAGER'
          ? '/manager'
          : '/schedule',
        {
          replace: true,
        },
      )
    } catch (error) {
        // console.log(error);
      const apiError =
        toApiError(error)

      setErrorMessage(
        getLoginErrorMessage(
          apiError.code,
        ),
      )
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:grid lg:place-items-center">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-[1.05fr_1fr]">
        <div className="hidden bg-blue-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold">
              S
            </div>

            <p className="mt-8 text-sm font-semibold tracking-[0.2em] text-blue-100">
              SHIFT MANAGEMENT
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
              紙のシフト管理を、
              <br />
              もっとシンプルに。
            </h1>

            <p className="mt-6 max-w-sm leading-7 text-blue-100">
              公開済みシフトの確認や、スタッフ管理をひとつの場所で行えます。
            </p>
          </div>

          <p className="text-sm text-blue-200">
            Shift Management System
          </p>
        </div>

        <div className="p-7 sm:p-10 lg:p-12">
          <div className="lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
              S
            </div>
          </div>

          <div className="mt-8 lg:mt-0">
            <p className="text-sm font-semibold text-blue-600">
              アカウント
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              ログイン
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              店舗から発行されたログインIDとパスワードを入力してください。
            </p>
          </div>

          <form
            className="mt-8 space-y-6"
            onSubmit={handleSubmit}
            noValidate
          >
            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="loginId"
              >
                ログインID
              </label>

              <input
                id="loginId"
                name="loginId"
                type="text"
                inputMode="numeric"
                autoComplete="username"
                maxLength={3}
                value={loginId}
                onChange={(event) => {
                  const nextValue =
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 3)

                  setLoginId(nextValue)
                }}
                placeholder="001"
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="password"
              >
                パスワード
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value,
                  )
                }}
                placeholder="パスワードを入力"
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

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
                loginMutation.isPending
              }
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loginMutation.isPending
                ? 'ログイン中...'
                : 'ログイン'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}