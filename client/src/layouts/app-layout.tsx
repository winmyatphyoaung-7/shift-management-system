import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router'

import {
  useCurrentMember,
  useLogout,
} from '../features/auth/auth-hooks.ts'
import { toApiError } from '../lib/api-error.ts'

export function AppLayout() {
  const navigate = useNavigate()

  const { data: member } =
    useCurrentMember()

  const logoutMutation = useLogout()

  if (!member) {
    return null
  }

  const homePath =
    member.role === 'MANAGER'
      ? '/manager'
      : '/schedule'

  const logoutError =
    logoutMutation.isError
      ? toApiError(logoutMutation.error)
      : null

  function handleLogout() {
    logoutMutation.mutate(
      undefined,
      {
        onSuccess: () => {
          navigate('/login', {
            replace: true,
          })
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <NavLink
              to={homePath}
              className="text-lg font-bold tracking-tight text-blue-700"
            >
              Shift Management
            </NavLink>

            <nav
              aria-label="メインナビゲーション"
              className="flex items-center gap-2"
            >
              {member.role ===
                'MANAGER' && (
                <NavLink
                  to="/manager"
                  className={({
                    isActive,
                  }) =>
                    [
                      'rounded-lg px-3 py-2 text-sm font-semibold transition',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                    ].join(' ')
                  }
                >
                  管理画面
                </NavLink>
              )}

              <NavLink
                to="/schedule"
                className={({
                  isActive,
                }) =>
                  [
                    'rounded-lg px-3 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                  ].join(' ')
                }
              >
                シフト
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {member.name}
              </p>

              <p className="text-xs text-slate-500">
                ID: {member.loginId}
                {' · '}
                {member.role ===
                'MANAGER'
                  ? 'Manager'
                  : 'Staff'}
              </p>
            </div>

            <button
              type="button"
              disabled={
                logoutMutation.isPending
              }
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {logoutMutation.isPending
                ? 'ログアウト中...'
                : 'ログアウト'}
            </button>
          </div>
        </div>

        {logoutError && (
          <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              ログアウトできませんでした。
              {logoutError.message}
            </p>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}