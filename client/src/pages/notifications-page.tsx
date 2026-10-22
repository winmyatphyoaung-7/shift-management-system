import {
    Link,
    useNavigate,
} from 'react-router'
import {
    useCurrentMember,
} from '../features/auth/auth-hooks.ts'
import {
    getNotificationDestination,
} from '../features/notifications/notification-navigation.ts'
import { toApiError } from '../lib/api-error.ts'
import {
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useNotifications,
} from '../features/notifications/notification-hooks.ts'
import { getNotificationCopy } from '../features/notifications/notification-copy.ts'

function formatNotificationDate(
    value: string,
): string {
    return new Intl.DateTimeFormat(
        'ja-JP',
        {
            dateStyle: 'medium',
            timeStyle: 'short',
        },
    ).format(new Date(value))
}

export function NotificationsPage() {

    const navigate =
        useNavigate()

    const currentMemberQuery =
        useCurrentMember()

    const notificationsQuery =
        useNotifications()

    const markReadMutation =
        useMarkNotificationRead()

    const markAllReadMutation =
        useMarkAllNotificationsRead()

    const mutationError =
        markReadMutation.isError
            ? toApiError(
                markReadMutation.error,
            )
            : markAllReadMutation.isError
                ? toApiError(
                    markAllReadMutation.error,
                )
                : null

    if (notificationsQuery.isLoading) {
        return (
            <p className="text-sm text-slate-600">
                通知を読み込んでいます...
            </p>
        )
    }

    if (
        notificationsQuery.isError ||
        !notificationsQuery.data
    ) {
        const error = toApiError(
            notificationsQuery.error,
        )

        return (
            <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
                通知を読み込めませんでした。
                {error.message}
            </p>
        )
    }

    const {
        notifications,
        unreadCount,
    } = notificationsQuery.data

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-blue-600">
                        NOTIFICATIONS
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                        通知
                    </h1>

                    <p className="mt-2 text-sm text-slate-600">
                        未読通知 {unreadCount} 件
                    </p>
                </div>

                <button
                    type="button"
                    disabled={
                        unreadCount === 0 ||
                        markAllReadMutation.isPending
                    }
                    onClick={() => {
                        markAllReadMutation.mutate()
                    }}
                    className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                    {markAllReadMutation.isPending
                        ? '更新中...'
                        : 'すべて既読にする'}
                </button>
            </div>

            {mutationError && (
                <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    通知を更新できませんでした。
                    {mutationError.message}
                </p>
            )}

            {notifications.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    通知はありません。
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(
                        (notification) => {
                            const copy =
                                getNotificationCopy(
                                    notification.type,
                                )

                            const isUnread =
                                notification.readAt === null

                            const isUpdating =
                                markReadMutation.isPending &&
                                markReadMutation.variables ===
                                notification.id

                            const destination =
                                currentMemberQuery.data
                                    ? getNotificationDestination(
                                        notification,
                                        currentMemberQuery.data.role,
                                    )
                                    : '/'

                            return (
                                <article
                                    key={notification.id}
                                    className={[
                                        'rounded-2xl border p-5 shadow-sm',
                                        isUnread
                                            ? 'border-blue-200 bg-blue-50'
                                            : 'border-slate-200 bg-white',
                                    ].join(' ')}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <Link
                                            to={destination}
                                            aria-disabled={isUpdating}
                                            onClick={(event) => {
                                                if (isUpdating) {
                                                    event.preventDefault()
                                                    return
                                                }

                                                if (!isUnread) {
                                                    return
                                                }

                                                event.preventDefault()

                                                markReadMutation.mutate(
                                                    notification.id,
                                                    {
                                                        onSuccess: () => {
                                                            navigate(
                                                                destination,
                                                            )
                                                        },
                                                    },
                                                )
                                            }}
                                            className="group min-w-0 flex-1 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isUnread && (
                                                    <span
                                                        aria-label="未読"
                                                        className="h-2.5 w-2.5 rounded-full bg-blue-600"
                                                    />
                                                )}

                                                <h2 className="font-semibold text-slate-950 transition group-hover:text-blue-700">
                                                    {copy.title}
                                                </h2>
                                            </div>

                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {copy.message}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                                <p className="text-xs text-slate-500">
                                                    {formatNotificationDate(
                                                        notification.createdAt,
                                                    )}
                                                </p>

                                                <span className="text-xs font-semibold text-blue-700 transition group-hover:translate-x-0.5 group-hover:text-blue-800">
                                                    詳細を見る →
                                                </span>
                                            </div>
                                        </Link>

                                        {isUnread && (
                                            <button
                                                type="button"
                                                disabled={isUpdating}
                                                onClick={() => {
                                                    markReadMutation.mutate(
                                                        notification.id,
                                                    )
                                                }}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                                            >
                                                {isUpdating
                                                    ? '更新中...'
                                                    : '既読にする'}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            )
                        },
                    )}
                </div>
            )}
        </section>
    )
}