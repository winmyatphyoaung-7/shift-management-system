import { apiClient } from '../../lib/api-client.ts'

import type {
    CoverageCandidate,
    CoverageCandidateResponse,
    MyCoverageActivityResponse,
    MyCoverageCandidacy,
    MyCoverageRequest,
    PublicCoverageRequest,
    CoverageRequestListResponse,
    CreateStaffCoverageRequestInput,
    CreateStaffCoverageRequestResponse,
    CreatedStaffCoverageRequest,
    CancelledCoverageRequest,
    CancelCoverageRequestResponse,
    CoverageRequestStatus,
    ManagerCoverageRequest,
    ManagerCoverageRequestListResponse,
    ApproveCoverageRequestInput,
    RejectCoverageRequestInput,
    ReviewedCoverageRequest,
    ReviewCoverageRequestResponse,
    CreateManagerCoverageRequestInput,
    CreateManagerCoverageRequestResponse,
    CreatedManagerCoverageRequest,
} from './coverage-types.ts'

export type MyCoverageActivity = {
    coverageRequests: MyCoverageRequest[]
    candidacies: MyCoverageCandidacy[]
}

export async function getPublicCoverageRequests(): Promise<
    PublicCoverageRequest[]
> {
    const response =
        await apiClient.get<CoverageRequestListResponse>(
            '/coverage-requests',
        )

    return response.data.data.coverageRequests
}

export async function getMyCoverageActivity(): Promise<
    MyCoverageActivity
> {
    const response =
        await apiClient.get<MyCoverageActivityResponse>(
            '/coverage-requests/mine',
        )

    return response.data.data
}

export async function volunteerForCoverageRequest(
    coverageRequestId: string,
): Promise<CoverageCandidate> {
    const response =
        await apiClient.post<CoverageCandidateResponse>(
            `/coverage-requests/${coverageRequestId}/volunteer`,
        )

    return response.data.data.candidate
}

export async function withdrawCoverageResponse(
    coverageRequestId: string,
): Promise<CoverageCandidate> {
    const response =
        await apiClient.post<CoverageCandidateResponse>(
            `/coverage-requests/${coverageRequestId}/withdraw`,
        )

    return response.data.data.candidate
}

export async function acceptDirectOffer(
    coverageRequestId: string,
): Promise<CoverageCandidate> {
    const response =
        await apiClient.post<CoverageCandidateResponse>(
            `/coverage-requests/${coverageRequestId}/direct-offer/accept`,
        )

    return response.data.data.candidate
}

export async function declineDirectOffer(
    coverageRequestId: string,
): Promise<CoverageCandidate> {
    const response =
        await apiClient.post<CoverageCandidateResponse>(
            `/coverage-requests/${coverageRequestId}/direct-offer/decline`,
        )

    return response.data.data.candidate
}

export async function createStaffCoverageRequest(
    input: CreateStaffCoverageRequestInput,
): Promise<CreatedStaffCoverageRequest> {
    const response =
        await apiClient.post<CreateStaffCoverageRequestResponse>(
            '/coverage-requests',
            input,
        )

    return response.data.data.coverageRequest
}

export async function cancelCoverageRequest(
    coverageRequestId: string,
): Promise<CancelledCoverageRequest> {
    const response =
        await apiClient.post<CancelCoverageRequestResponse>(
            `/coverage-requests/${coverageRequestId}/cancel`,
        )

    return response.data.data.coverageRequest
}

export async function getManagerCoverageRequests(
    status?: CoverageRequestStatus,
): Promise<ManagerCoverageRequest[]> {
    const response =
        await apiClient.get<ManagerCoverageRequestListResponse>(
            '/coverage-requests/manager',
            {
                params: status
                    ? {
                        status,
                    }
                    : undefined,
            },
        )

    return response.data.data.coverageRequests
}

export async function approveAndOpenCoverageRequest({
    coverageRequestId,
    responseDeadline,
}: ApproveCoverageRequestInput): Promise<ReviewedCoverageRequest> {
    const response =
        await apiClient.post<ReviewCoverageRequestResponse>(
            `/coverage-requests/${coverageRequestId}/approve-open`,
            {
                responseDeadline,
            },
        )

    return response.data.data.coverageRequest
}

export async function rejectCoverageRequest({
    coverageRequestId,
    rejectionNote,
}: RejectCoverageRequestInput): Promise<ReviewedCoverageRequest> {
    const response =
        await apiClient.post<ReviewCoverageRequestResponse>(
            `/coverage-requests/${coverageRequestId}/reject`,
            {
                ...(rejectionNote
                    ? {
                        rejectionNote,
                    }
                    : {}),
            },
        )

    return response.data.data.coverageRequest
}

export async function createManagerCoverageRequest(
    input: CreateManagerCoverageRequestInput,
): Promise<CreatedManagerCoverageRequest> {
    const response =
        await apiClient.post<CreateManagerCoverageRequestResponse>(
            '/coverage-requests/manager',
            input,
        )

    return response.data.data.coverageRequest
}