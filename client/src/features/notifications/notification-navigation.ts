import type {
  MemberRole,
} from '../auth/auth-types.ts'
import type {
  AppNotification,
  NotificationReferenceData,
  NotificationType,
} from './notification-types.ts'

const SHIFT_NOTIFICATION_TYPES =
  new Set<NotificationType>([
    'SCHEDULE_PUBLISHED',
    'PUBLISHED_SHIFT_ASSIGNED',
    'PUBLISHED_SHIFT_TIME_CHANGED',
    'PUBLISHED_SHIFT_REASSIGNED',
    'PUBLISHED_SHIFT_CANCELLED',
  ])

function getReferenceString(
  referenceData:
    NotificationReferenceData,
  key: string,
): string | null {
  if (!referenceData) {
    return null
  }

  const value =
    referenceData[key]

  return typeof value === 'string'
    ? value
    : null
}

export function getNotificationDestination(
  notification: AppNotification,
  role: MemberRole,
): string {
  if (
    SHIFT_NOTIFICATION_TYPES.has(
      notification.type,
    )
  ) {
    const scheduleDate =
      getReferenceString(
        notification.referenceData,
        'scheduleDate',
      ) ??
      getReferenceString(
        notification.referenceData,
        'from',
      )

    return scheduleDate
      ? `/schedule?date=${encodeURIComponent(
          scheduleDate,
        )}`
      : '/schedule'
  }

  const basePath =
    role === 'MANAGER'
      ? '/manager/replacements'
      : '/my-replacements'

  const coverageRequestId =
    getReferenceString(
      notification.referenceData,
      'coverageRequestId',
    )

  return coverageRequestId
    ? `${basePath}?requestId=${encodeURIComponent(
        coverageRequestId,
      )}`
    : basePath
}