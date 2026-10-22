import type {
    ApiSuccessResponse,
} from '../../types/api.ts'

export type CoverageRequestStatus =
    | 'PENDING_REVIEW'
    | 'OPEN'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'EXPIRED'

export type CoverageRequestSource =
    | 'STAFF'
    | 'MANAGER'

export type CoverageReasonCategory =
    | 'HEALTH'
    | 'SCHOOL'
    | 'PERSONAL'
    | 'OTHER'

export type CoverageCandidateType =
    | 'VOLUNTEER'
    | 'DIRECT_OFFER'

export type CoverageCandidateStatus =
    | 'PENDING'
    | 'AVAILABLE'
    | 'DECLINED'
    | 'WITHDRAWN'
    | 'SELECTED'
    | 'NOT_SELECTED'
    | 'EXPIRED'

export type CoverageMemberSummary = {
    id: string
    colorKey: string
    user: {
        name: string
    }
}

export type CoverageScheduleDay = {
    scheduleDate: string
    status: 'DRAFT' | 'PUBLISHED'
}

export type CoverageCandidate = {
    id: string
    coverageRequestId: string
    membershipId: string
    type: CoverageCandidateType
    status: CoverageCandidateStatus
    respondedAt: string | null
    createdAt: string
    updatedAt: string
}

export type PublicCoverageRequest = {
    id: string
    shiftId: string
    requestedStartAt: string
    requestedEndAt: string
    status: 'OPEN'
    responseDeadline: string
    createdAt: string
    shift: {
        status: 'ACTIVE' | 'CANCELLED'
        scheduleDay: CoverageScheduleDay
    }
    originalAssignee:
    CoverageMemberSummary
    candidates: Array<{
        id: string
        type: CoverageCandidateType
        status: CoverageCandidateStatus
        respondedAt: string | null
    }>
}

export type MyCoverageRequest = {
    id: string
    shiftId: string
    source: CoverageRequestSource
    reasonCategory:
    CoverageReasonCategory
    reasonDetails: string | null
    requestedStartAt: string
    requestedEndAt: string
    status: CoverageRequestStatus
    responseDeadline: string | null
    rejectionNote: string | null
    approvedAt: string | null
    selectedCandidateId: string | null
    createdAt: string
    updatedAt: string
    shift: {
        id: string
        status: 'ACTIVE' | 'CANCELLED'
        startAt: string
        endAt: string
        scheduleDay: CoverageScheduleDay
        assignee: CoverageMemberSummary
    }
    _count: {
        candidates: number
    }
}

export type MyCoverageCandidacy = {
    id: string
    type: CoverageCandidateType
    status: CoverageCandidateStatus
    respondedAt: string | null
    createdAt: string
    updatedAt: string
    coverageRequest: {
        id: string
        shiftId: string
        source: CoverageRequestSource
        requestedStartAt: string
        requestedEndAt: string
        status: CoverageRequestStatus
        responseDeadline: string | null
        approvedAt: string | null
        selectedCandidateId: string | null
        createdAt: string
        shift: {
            status: 'ACTIVE' | 'CANCELLED'
            scheduleDay: CoverageScheduleDay
            assignee: CoverageMemberSummary
        }
        originalAssignee:
        CoverageMemberSummary
    }
}

export type CreateStaffCoverageRequestInput = {
    shiftId: string
    reasonCategory:
    CoverageReasonCategory
    reasonDetails?: string
}

export type CoverageRequestListResponse =
    ApiSuccessResponse<{
        coverageRequests:
        PublicCoverageRequest[]
    }>

export type MyCoverageActivityResponse =
    ApiSuccessResponse<{
        coverageRequests:
        MyCoverageRequest[]
        candidacies:
        MyCoverageCandidacy[]
    }>

export type CoverageCandidateResponse =
    ApiSuccessResponse<{
        candidate: CoverageCandidate
    }>

export type CreatedStaffCoverageRequest = {
    id: string
    shiftId: string
    originalAssigneeMembershipId: string
    requesterMembershipId: string
    source: 'STAFF'
    reasonCategory:
    CoverageReasonCategory
    reasonDetails: string | null
    requestedStartAt: string
    requestedEndAt: string
    status: 'PENDING_REVIEW'
    responseDeadline: string | null
    createdAt: string
    updatedAt: string
}

export type CreateStaffCoverageRequestResponse =
    ApiSuccessResponse<{
        coverageRequest:
        CreatedStaffCoverageRequest
    }>

export type CancelledCoverageRequest = {
    id: string
    shiftId: string
    requesterMembershipId: string
    status: 'CANCELLED'
    updatedAt: string
    candidates: Array<{
        id: string
        membershipId: string
        type: CoverageCandidateType
        status: CoverageCandidateStatus
    }>
}

export type CancelCoverageRequestResponse =
    ApiSuccessResponse<{
        coverageRequest:
        CancelledCoverageRequest
    }>

export type ManagerCoverageMember = {
    id: string
    loginId: string
    role: 'MANAGER' | 'STAFF'
    status: 'ACTIVE' | 'INACTIVE'
    colorKey: string
    user: {
        name: string
    }
}

export type ManagerCoverageCandidate = {
    id: string
    type: CoverageCandidateType
    status: CoverageCandidateStatus
    respondedAt: string | null
    createdAt: string
    updatedAt: string
    membership: ManagerCoverageMember
}

export type ManagerCoverageRequest = {
    id: string
    shiftId: string
    source: CoverageRequestSource
    reasonCategory: CoverageReasonCategory
    reasonDetails: string | null
    requestedStartAt: string
    requestedEndAt: string
    status: CoverageRequestStatus
    responseDeadline: string | null
    rejectionNote: string | null
    approvedAt: string | null
    selectedCandidateId: string | null
    createdAt: string
    updatedAt: string
    shift: {
        id: string
        status: 'ACTIVE' | 'CANCELLED'
        startAt: string
        endAt: string
        note: string | null
        scheduleDay: CoverageScheduleDay
    }
    originalAssignee: ManagerCoverageMember
    requester: ManagerCoverageMember
    candidates: ManagerCoverageCandidate[]
    _count: {
        candidates: number
    }
}

export type ManagerCoverageRequestListResponse =
    ApiSuccessResponse<{
        coverageRequests:
        ManagerCoverageRequest[]
    }>

export type ReviewedCoverageRequest = {
    id: string
    shiftId: string
    source: CoverageRequestSource
    reasonCategory: CoverageReasonCategory
    reasonDetails: string | null
    requestedStartAt: string
    requestedEndAt: string
    status: 'OPEN' | 'REJECTED'
    responseDeadline: string | null
    rejectionNote: string | null
    createdAt: string
    updatedAt: string
}

export type ReviewCoverageRequestResponse =
    ApiSuccessResponse<{
        coverageRequest:
        ReviewedCoverageRequest
    }>

export type ApproveCoverageRequestInput = {
    coverageRequestId: string
    responseDeadline: string
}

export type RejectCoverageRequestInput = {
    coverageRequestId: string
    rejectionNote?: string
}

export type CreateManagerCoverageRequestInput = {
    shiftId: string
    reasonCategory:
    CoverageReasonCategory
    reasonDetails?: string
    responseDeadline: string
}

export type CreatedManagerCoverageRequest = {
    id: string
    shiftId: string
    originalAssigneeMembershipId: string
    requesterMembershipId: string
    source: 'MANAGER'
    reasonCategory:
    CoverageReasonCategory
    reasonDetails: string | null
    requestedStartAt: string
    requestedEndAt: string
    status: 'OPEN'
    responseDeadline: string
    createdAt: string
    updatedAt: string
}

export type CreateManagerCoverageRequestResponse =
    ApiSuccessResponse<{
        coverageRequest:
        CreatedManagerCoverageRequest
    }>

export type SendDirectOffersInput = {
    coverageRequestId: string
    membershipIds: string[]
}

export type SendDirectOffersResponse =
    ApiSuccessResponse<{
        candidates:
        CoverageCandidate[]
    }>

export type FinalApproveCoverageRequestInput = {
    coverageRequestId: string
    selectedCandidateId: string
}

export type FinalApprovedCoverageRequest = {
    id: string
    status: 'APPROVED'
    approvedAt: string
    approvedByMembershipId: string
    selectedCandidateId: string
    shift: {
        id: string
        assigneeMembershipId: string
        startAt: string
        endAt: string
        status: 'ACTIVE'
    }
    candidates: Array<{
        id: string
        membershipId: string
        type: CoverageCandidateType
        status: CoverageCandidateStatus
        respondedAt: string | null
    }>
}

export type FinalApproveCoverageRequestResponse =
    ApiSuccessResponse<{
        coverageRequest:
        FinalApprovedCoverageRequest
    }>

export type ExtendCoverageDeadlineInput = {
    coverageRequestId: string
    responseDeadline: string
}

export type ExtendedCoverageRequest = {
    id: string
    status: 'OPEN'
    responseDeadline: string
    requestedStartAt: string
    requestedEndAt: string
    updatedAt: string
}

export type ExtendCoverageDeadlineResponse =
    ApiSuccessResponse<{
        coverageRequest:
        ExtendedCoverageRequest
    }>