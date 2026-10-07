import type { ApiSuccessResponse } from '../../types/api.ts'
import type { MemberRole } from '../auth/auth-types.ts'
import type { MemberColorKey } from '../members/member-types.ts'

export type ScheduleDayStatus =
    | 'DRAFT'
    | 'PUBLISHED'

export type ShiftStatus =
    | 'ACTIVE'
    | 'CANCELLED'

export type ScheduleDateRange = {
    from: string
    to: string
}

export type ScheduleCoveragePreset = {
    id: string
    name: string
    startMinute: number
    endMinute: number
    crossesMidnight: boolean
    sortOrder: number
}

export type CoverageRequirement = {
    id: string
    startAt: string
    endAt: string
    requiredCount: number
    shiftPreset: ScheduleCoveragePreset
}

export type ScheduleShiftPreset = {
    id: string
    name: string
}

export type ScheduleShiftAssignee = {
    id: string
    loginId: string
    role: MemberRole
    colorKey: MemberColorKey
    user: {
        name: string
    }
}

export type ScheduleShift = {
    id: string
    startAt: string
    endAt: string
    breakMinutes: number
    status: ShiftStatus
    note: string | null
    cancelledAt: string | null
    createdAt: string
    updatedAt: string
    shiftPreset:
    | ScheduleShiftPreset
    | null
    assignee: ScheduleShiftAssignee
}

export type UnderstaffedWarning = {
    code: 'UNDERSTAFFED'
    coverageRequirementId: string
    shiftPresetId: string
    shiftPresetName: string
    startAt: string
    endAt: string
    requiredCount: number
    assignedCount: number
    shortageCount: number
}

export type ScheduleDay = {
    id: string
    scheduleDate: string
    status: ScheduleDayStatus
    publishedAt: string | null
    publishedByMembershipId:
    | string
    | null
    createdAt: string
    updatedAt: string
    coverageRequirements:
    CoverageRequirement[]
    shifts: ScheduleShift[]
    coverageWarnings:
    UnderstaffedWarning[]
}

export type ListScheduleDaysResponse =
    ApiSuccessResponse<{
        scheduleDays: ScheduleDay[]
    }>

export type CreateShiftsInput = {
    scheduleDate: string
    shiftPresetId?: string
    assigneeMembershipIds: string[]
    startAt: string
    endAt: string
    note?: string
}

export type CreatedShift = {
    id: string
    scheduleDayId: string
    assigneeMembershipId: string
    shiftPresetId: string | null
    startAt: string
    endAt: string
    breakMinutes: number
    status: ShiftStatus
    note: string | null
    createdAt: string
    updatedAt: string
}

export type AdjacentShiftWarning = {
    code: 'ADJACENT_SHIFT'
    membershipId: string
    message: string
}

export type CreateShiftsResult = {
    shifts: CreatedShift[]
    warnings: AdjacentShiftWarning[]
}

export type CreateShiftsResponse =
    ApiSuccessResponse<CreateShiftsResult>

export type UpdateShiftBody = {
    assigneeMembershipId?: string
    shiftPresetId?: string | null
    startAt?: string
    endAt?: string
    note?: string | null
}

export type UpdateShiftInput = {
    shiftId: string
    body: UpdateShiftBody
}

export type UpdateShiftResult = {
    shift: CreatedShift
    warnings: AdjacentShiftWarning[]
}

export type UpdateShiftResponse =
    ApiSuccessResponse<UpdateShiftResult>

export type RemoveShiftInput = {
    shiftId: string
}
export type PublishScheduleInput =
    ScheduleDateRange

export type PublishedScheduleDay = {
    id: string
    scheduleDate: string
    status: ScheduleDayStatus
    publishedAt: string | null
    publishedByMembershipId:
    | string
    | null
    shiftCount: number
    coverageWarnings:
    UnderstaffedWarning[]
}

export type PublishScheduleResult = {
    publishedDays:
    PublishedScheduleDay[]
    summary: {
        publishedDateCount: number
        shiftCount: number
        coverageWarningCount: number
    }
}

export type PublishScheduleResponse =
    ApiSuccessResponse<PublishScheduleResult>

export type CopyWeekInput = {
    sourceWeekStart: string
    targetWeekStart: string
    confirmed: boolean
}

export type CopyWeekWarning = {
    code: 'INACTIVE_ASSIGNEE_SKIPPED'
    shiftId: string
    membershipId: string
    message: string
}

export type CopyWeekPreview = {
    sourceWeek: ScheduleDateRange
    targetWeek: ScheduleDateRange
    sourceShiftCount: number
    copyableShiftCount: number
    skippedShiftCount: number
    warnings: CopyWeekWarning[]
}

export type CopyWeekPreviewResult = {
    copied: false
    preview: CopyWeekPreview
}

export type CopyWeekCompletedResult = {
    copied: true
    preview: CopyWeekPreview
    createdScheduleDayCount: number
    createdShiftCount: number
}

export type CopyWeekResult =
    | CopyWeekPreviewResult
    | CopyWeekCompletedResult

export type CopyWeekResponse =
    ApiSuccessResponse<CopyWeekResult>