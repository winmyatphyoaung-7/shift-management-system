import type {
  NotificationType,
} from './notification-types.ts'

type NotificationCopy = {
  title: string
  message: string
}

const notificationCopies: Record<
  NotificationType,
  NotificationCopy
> = {
  SCHEDULE_PUBLISHED: {
    title: 'シフトが公開されました',
    message:
      '新しいシフトが公開されました。予定を確認してください。',
  },

  PUBLISHED_SHIFT_ASSIGNED: {
  title: '新しいシフトが追加されました',
  message:
    '公開済みのシフト表に新しい勤務が追加されました。予定を確認してください。',
},

  PUBLISHED_SHIFT_TIME_CHANGED: {
    title: 'シフト時間が変更されました',
    message:
      '公開済みシフトの勤務時間が変更されました。',
  },

  PUBLISHED_SHIFT_REASSIGNED: {
    title: 'シフト担当者が変更されました',
    message:
      '公開済みシフトの担当者が変更されました。',
  },

  PUBLISHED_SHIFT_CANCELLED: {
    title: 'シフトがキャンセルされました',
    message:
      '公開済みシフトがキャンセルされました。',
  },

  COVERAGE_REQUEST_SUBMITTED: {
    title: '交代依頼が提出されました',
    message:
      'スタッフからシフトの交代依頼が提出されました。',
  },

  COVERAGE_REQUEST_OPENED: {
    title: '交代依頼の受付が開始されました',
    message:
      'シフト交代の候補者を募集しています。',
  },

  COVERAGE_REQUEST_REJECTED: {
    title: '交代依頼が却下されました',
    message:
      '提出したシフト交代依頼が却下されました。',
  },

  COVERAGE_REQUEST_CANCELLED: {
    title: '交代依頼がキャンセルされました',
    message:
      'シフト交代依頼がキャンセルされました。',
  },

  COVERAGE_REQUEST_EXPIRED: {
    title: '交代依頼の期限が切れました',
    message:
      '交代者が決まる前に交代依頼の期限が切れました。',
  },

  DIRECT_OFFER_RECEIVED: {
    title: 'シフト交代の依頼が届きました',
    message:
      'シフトを代わることができるか回答してください。',
  },

  DIRECT_OFFER_ACCEPTED: {
    title: '交代依頼が承諾されました',
    message:
      'スタッフがシフト交代の依頼を承諾しました。',
  },

  DIRECT_OFFER_DECLINED: {
    title: '交代依頼が辞退されました',
    message:
      'スタッフがシフト交代の依頼を辞退しました。',
  },

  DIRECT_OFFER_WITHDRAWN: {
    title: '交代の回答が取り消されました',
    message:
      'スタッフがシフト交代への回答を取り消しました。',
  },

  VOLUNTEER_JOINED: {
    title: '交代希望者が見つかりました',
    message:
      'スタッフがシフト交代に立候補しました。',
  },

  VOLUNTEER_WITHDRAWN: {
    title: '交代希望が取り消されました',
    message:
      'スタッフがシフト交代への立候補を取り消しました。',
  },

  CANDIDATE_SELECTED: {
    title: '交代スタッフに選ばれました',
    message:
      'あなたがシフトの交代スタッフに選ばれました。',
  },

  CANDIDATE_NOT_SELECTED: {
    title: '別の交代スタッフが選ばれました',
    message:
      '今回のシフト交代では別のスタッフが選ばれました。',
  },

  COVERAGE_REPLACEMENT_APPROVED: {
    title: 'シフト交代が承認されました',
    message:
      'あなたのシフトを担当する交代スタッフが決まりました。',
  },

  COVERAGE_DEADLINE_EXTENDED: {
    title: '回答期限が延長されました',
    message:
      'シフト交代依頼への回答期限が延長されました。',
  },
}

export function getNotificationCopy(
  type: NotificationType,
): NotificationCopy {
  return notificationCopies[type]
}