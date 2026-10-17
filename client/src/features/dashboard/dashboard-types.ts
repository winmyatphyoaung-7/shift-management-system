import type {
  MemberRole,
} from '../auth/auth-types.ts'
import type {
  ApiSuccessResponse,
} from '../../types/api.ts'

type ShiftPresetSummary = {
  id: string
  name: string
}

export type StaffDashboardShift = {
  id: string
  startAt: string
  endAt: string
  breakMinutes: number
  status: 'ACTIVE'
  note: string | null
  shiftPreset:
    | ShiftPresetSummary
    | null
  scheduleDay: {
    id: string
    scheduleDate: string
    status: 'PUBLISHED'
  }
}

export type StaffDashboard = {
  generatedAt: string
  nextShift:
    | StaffDashboardShift
    | null
  alerts: {
    unreadNotificationCount: number
    pendingDirectOfferCount: number
    activeOwnRequestCount: number
    openCoverageRequestCount: number
  }
}

export type ManagerDashboardShift = {
  id: string
  startAt: string
  endAt: string
  breakMinutes: number
  note: string | null
  shiftPreset:
    | ShiftPresetSummary
    | null
  assignee: {
    id: string
    loginId: string
    role: MemberRole
    colorKey: string
    user: {
      name: string
    }
  }
}

export type UnderstaffedInterval = {
  code: 'UNDERSTAFFED'
  coverageRequirementId: string
  shiftPresetId: string
  shiftPresetName: string
  startAt: string
  endAt: string
  requiredCount: number
  assignedCount: number
  shortageCount: number
  scheduleDayId: string
  scheduleDate: string
}

export type ManagerDashboard = {
  generatedAt: string
  timeZone: string
  today: {
    scheduleDate: string
    assignedMemberCount: number
    shifts: ManagerDashboardShift[]
  }
  alerts: {
    pendingReviewCount: number
    openDeadlineAttentionCount: number
    availableDirectOfferCount: number
    upcomingUnderstaffedCount: number
    draftScheduleDayCount: number
    unreadNotificationCount: number
  }
  upcomingUnderstaffedIntervals:
    UnderstaffedInterval[]
}

export type StaffDashboardResponse =
  ApiSuccessResponse<{
    dashboard: StaffDashboard
  }>

export type ManagerDashboardResponse =
  ApiSuccessResponse<{
    dashboard: ManagerDashboard
  }>