import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router'

import { toApiError } from '../../lib/api-error.ts'
import { useCurrentMember } from './auth-hooks.ts'

export function RequireAuth() {
  const location = useLocation()

  const {
    data: member,
    error,
    isError,
    isFetching,
    isPending,
    refetch,
  } = useCurrentMember()

  if (isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
        <div
          className="text-center"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            ログイン状態を確認しています...
          </p>
        </div>
      </main>
    )
  }

  if (isError) {
    const apiError = toApiError(error)

    if (
      apiError.code ===
      'UNAUTHORIZED'
    ) {
      return (
        <Navigate
          to="/login"
          replace
          state={{
            from: location.pathname,
          }}
        />
      )
    }

    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">
            サーバーに接続できません
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            通信状況を確認して、もう一度お試しください。
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
              ? '再確認中...'
              : 'もう一度試す'}
          </button>
        </section>
      </main>
    )
  }

  if (!member) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return <Outlet />
}