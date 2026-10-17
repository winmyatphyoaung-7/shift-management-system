
import type { ApiSuccessResponse } from '../../types/api.ts'

export type NotificationType =
  | 'SCHEDULE_PUBLISHED'
  | 'PUBLISHED_SHIFT_TIME_CHANGED'
  | 'PUBLISHED_SHIFT_REASSIGNED'
  | 'PUBLISHED_SHIFT_CANCELLED'
  | 'COVERAGE_REQUEST_SUBMITTED'
  | 'COVERAGE_REQUEST_OPENED'
  | 'COVERAGE_REQUEST_REJECTED'
  | 'COVERAGE_REQUEST_CANCELLED'
  | 'COVERAGE_REQUEST_EXPIRED'
  | 'DIRECT_OFFER_RECEIVED'
  | 'DIRECT_OFFER_ACCEPTED'
  | 'DIRECT_OFFER_DECLINED'
  | 'DIRECT_OFFER_WITHDRAWN'
  | 'VOLUNTEER_JOINED'
  | 'VOLUNTEER_WITHDRAWN'
  | 'CANDIDATE_SELECTED'
  | 'CANDIDATE_NOT_SELECTED'
  | 'COVERAGE_REPLACEMENT_APPROVED'
  | 'COVERAGE_DEADLINE_EXTENDED'

export type NotificationReferenceData =
  Record<string, unknown> | null

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  referenceData: NotificationReferenceData
  readAt: string | null
  createdAt: string
}

export type ListNotificationsResponse =
  ApiSuccessResponse<{
    notifications: AppNotification[]
    unreadCount: number
  }>

export type NotificationResponse =
  ApiSuccessResponse<{
    notification: AppNotification
  }>

export type MarkAllNotificationsReadResponse =
  ApiSuccessResponse<{
    updatedCount: number
  }>