import { Link } from 'react-router'

import { useStaffDashboard } from '../features/dashboard/dashboard-hooks.ts'
import { toApiError } from '../lib/api-error.ts'

function formatShiftDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'ja-JP',
    {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    },
  ).format(new Date(value))
}

function formatShiftTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'ja-JP',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  ).format(new Date(value))
}

export function StaffDashboardPage() {
  const dashboardQuery =
    useStaffDashboard()

  if (dashboardQuery.isLoading) {
    return (
      <p className="text-sm text-slate-600">
        ダッシュボードを読み込んでいます...
      </p>
    )
  }

  if (
    dashboardQuery.isError ||
    !dashboardQuery.data
  ) {
    const error = toApiError(
      dashboardQuery.error,
    )

    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        ダッシュボードを読み込めませんでした。
        {error.message}
      </p>
    )
  }

  const dashboard =
    dashboardQuery.data

  const nextShift =
    dashboard.nextShift

  const alertCards = [
    {
      label: '未読通知',
      count:
        dashboard.alerts
          .unreadNotificationCount,
      description:
        '確認していない通知',
      tone:
        'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
      label: '直接オファー',
      count:
        dashboard.alerts
          .pendingDirectOfferCount,
      description:
        '回答が必要な交代依頼',
      tone:
        'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      label: '自分の交代依頼',
      count:
        dashboard.alerts
          .activeOwnRequestCount,
      description:
        '確認中または募集中',
      tone:
        'border-violet-200 bg-violet-50 text-violet-700',
    },
    {
      label: '募集中の交代',
      count:
        dashboard.alerts
          .openCoverageRequestCount,
      description:
        '立候補できるシフト',
      tone:
        'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  ]

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold tracking-wide text-blue-600">
          STAFF DASHBOARD
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          ホーム
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          次の勤務予定とお知らせを確認できます。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {alertCards.map((alert) => (
          <article
            key={alert.label}
            className={[
              'rounded-2xl border p-5 shadow-sm',
              alert.tone,
            ].join(' ')}
          >
            <p className="text-sm font-semibold">
              {alert.label}
            </p>

            <p className="mt-3 text-3xl font-bold">
              {alert.count}
            </p>

            <p className="mt-2 text-xs opacity-80">
              {alert.description}
            </p>
          </article>
        ))}
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              NEXT SHIFT
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              次のシフト
            </h2>
          </div>

          <Link
            to="/schedule"
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            シフト表を見る
          </Link>
        </div>

        {!nextShift ? (
          <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            今後の公開済みシフトはありません。
          </p>
        ) : (
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="text-lg font-bold text-slate-950">
              {formatShiftDate(
                nextShift.startAt,
              )}
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-700">
              {formatShiftTime(
                nextShift.startAt,
              )}
              {' ～ '}
              {formatShiftTime(
                nextShift.endAt,
              )}
            </p>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">
                  シフト区分
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {nextShift.shiftPreset
                    ?.name ??
                    'カスタムシフト'}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  休憩時間
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {nextShift.breakMinutes}
                  分
                </dd>
              </div>
            </dl>

            {nextShift.note && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold text-slate-500">
                  メモ
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {nextShift.note}
                </p>
              </div>
            )}
          </div>
        )}
      </article>

      {dashboard.alerts
        .unreadNotificationCount > 0 && (
        <Link
          to="/notifications"
          className="block rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          未読通知を確認する →
        </Link>
      )}
    </section>
  )
}