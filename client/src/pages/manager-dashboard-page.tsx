import { Link } from 'react-router'

import { useManagerDashboard } from '../features/dashboard/dashboard-hooks.ts'
import { toApiError } from '../lib/api-error.ts'

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'ja-JP',
    {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    },
  ).format(
    new Date(`${value}T00:00:00`),
  )
}

function formatTime(
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

export function ManagerDashboardPage() {
  const dashboardQuery =
    useManagerDashboard()

  if (dashboardQuery.isLoading) {
    return (
      <p className="text-sm text-slate-600">
        管理ダッシュボードを読み込んでいます...
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
        管理ダッシュボードを読み込めませんでした。
        {error.message}
      </p>
    )
  }

  const dashboard =
    dashboardQuery.data

  const alertCards = [
    {
      label: '確認待ちの交代依頼',
      count:
        dashboard.alerts
          .pendingReviewCount,
      description:
        '承認または却下が必要',
      tone:
        'border-red-200 bg-red-50 text-red-700',
    },
    {
      label: '期限が近い交代依頼',
      count:
        dashboard.alerts
          .openDeadlineAttentionCount,
      description:
        '24時間以内または期限超過',
      tone:
        'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      label: '最終承認待ち',
      count:
        dashboard.alerts
          .availableDirectOfferCount,
      description:
        '承諾済みの直接オファー',
      tone:
        'border-violet-200 bg-violet-50 text-violet-700',
    },
    {
      label: '人員不足',
      count:
        dashboard.alerts
          .upcomingUnderstaffedCount,
      description:
        '今後7日間の不足時間帯',
      tone:
        'border-orange-200 bg-orange-50 text-orange-700',
    },
    {
      label: '未公開の日',
      count:
        dashboard.alerts
          .draftScheduleDayCount,
      description:
        '今後の下書き日',
      tone:
        'border-slate-200 bg-slate-50 text-slate-700',
    },
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
  ]

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold tracking-wide text-blue-600">
          MANAGER DASHBOARD
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          管理ダッシュボード
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          本日のシフト状況と対応が必要な項目を確認できます。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              TODAY
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              {formatDate(
                dashboard.today
                  .scheduleDate,
              )}
              のシフト
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              担当スタッフ
              {' '}
              {
                dashboard.today
                  .assignedMemberCount
              }
              人
            </p>
          </div>

          <Link
            to="/schedule"
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            シフト表を開く
          </Link>
        </div>

        {dashboard.today.shifts.length ===
        0 ? (
          <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            本日の公開済みシフトはありません。
          </p>
        ) : (
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {dashboard.today.shifts.map(
              (shift) => (
                <div
                  key={shift.id}
                  className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {
                        shift.assignee
                          .user.name
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      ID:
                      {' '}
                      {
                        shift.assignee
                          .loginId
                      }
                      {' · '}
                      {shift.shiftPreset
                        ?.name ??
                        'カスタムシフト'}
                    </p>
                  </div>

                  <p className="font-semibold text-blue-700">
                    {formatTime(
                      shift.startAt,
                    )}
                    {' ～ '}
                    {formatTime(
                      shift.endAt,
                    )}
                  </p>
                </div>
              ),
            )}
          </div>
        )}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-600">
              COVERAGE ALERTS
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              今後の人員不足
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              今後7日間で必要人数を満たしていない時間帯です。
            </p>
          </div>

          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
            {
              dashboard.alerts
                .upcomingUnderstaffedCount
            }
            件
          </span>
        </div>

        {dashboard
          .upcomingUnderstaffedIntervals
          .length === 0 ? (
          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-6 text-center text-sm font-semibold text-emerald-700">
            今後7日間の人員不足はありません。
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {dashboard
              .upcomingUnderstaffedIntervals
              .map((interval) => (
                <div
                  key={[
                    interval
                      .coverageRequirementId,
                    interval.startAt,
                  ].join('-')}
                  className="grid gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {formatDate(
                        interval.scheduleDate,
                      )}
                      {' · '}
                      {
                        interval
                          .shiftPresetName
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {formatTime(
                        interval.startAt,
                      )}
                      {' ～ '}
                      {formatTime(
                        interval.endAt,
                      )}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-bold text-orange-700">
                      あと
                      {
                        interval.shortageCount
                      }
                      人必要
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      配置
                      {
                        interval.assignedCount
                      }
                      人 / 必要
                      {
                        interval.requiredCount
                      }
                      人
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </article>
    </section>
  )
}