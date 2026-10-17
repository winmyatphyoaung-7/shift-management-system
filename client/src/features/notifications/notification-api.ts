import { apiClient } from '../../lib/api-client.ts'

import type {
  AppNotification,
  ListNotificationsResponse,
  MarkAllNotificationsReadResponse,
  NotificationResponse,
} from './notification-types.ts'

export type NotificationListResult = {
  notifications: AppNotification[]
  unreadCount: number
}

export async function getNotifications(): Promise<
  NotificationListResult
> {
  const response =
    await apiClient.get<ListNotificationsResponse>(
      '/notifications',
    )

  return response.data.data
}

export async function markNotificationRead(
  notificationId: string,
): Promise<AppNotification> {
  const response =
    await apiClient.patch<NotificationResponse>(
      `/notifications/${notificationId}/read`,
    )

  return response.data.data.notification
}

export async function markAllNotificationsRead(): Promise<number> {
  const response =
    await apiClient.patch<MarkAllNotificationsReadResponse>(
      '/notifications/read-all',
    )

  return response.data.data.updatedCount
}