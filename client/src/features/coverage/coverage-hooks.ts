import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import {
    acceptDirectOffer,
    declineDirectOffer,
    getMyCoverageActivity,
    getPublicCoverageRequests,
    volunteerForCoverageRequest,
    withdrawCoverageResponse,
    createStaffCoverageRequest,
    cancelCoverageRequest,
    getManagerCoverageRequests,
    approveAndOpenCoverageRequest,
    rejectCoverageRequest,
    createManagerCoverageRequest,
} from './coverage-api.ts'
import type {
    CoverageRequestStatus,
} from './coverage-types.ts'
import {
    dashboardQueryKeys,
} from '../dashboard/dashboard-hooks.ts'

export const coverageQueryKeys = {
    all: ['coverage-requests'] as const,

    public: [
        'coverage-requests',
        'public',
    ] as const,

    mine: [
        'coverage-requests',
        'mine',
    ] as const,

    manager: (
        status?: CoverageRequestStatus,
    ) =>
        [
            'coverage-requests',
            'manager',
            status ?? 'ALL',
        ] as const,
}

export function usePublicCoverageRequests() {
    return useQuery({
        queryKey: coverageQueryKeys.public,
        queryFn: getPublicCoverageRequests,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        refetchIntervalInBackground: false,
        retry: false,
    })
}

export function useMyCoverageActivity(
    enabled = true,
) {
    return useQuery({
        queryKey: coverageQueryKeys.mine,
        queryFn: getMyCoverageActivity,
        enabled,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        refetchIntervalInBackground: false,
        retry: false,
    })
}

export function useManagerCoverageRequests(
    status?: CoverageRequestStatus,
    enabled = true,
) {
    return useQuery({
        queryKey:
            coverageQueryKeys.manager(status),
        queryFn: () =>
            getManagerCoverageRequests(status),
        enabled,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        refetchIntervalInBackground: false,
        retry: false,
    })
}

function useCoverageAction(
    mutationFn: (
        coverageRequestId: string,
    ) => Promise<unknown>,
) {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn,

        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: coverageQueryKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey: dashboardQueryKeys.all,
                }),
            ])
        },
    })
}

export function useVolunteerForCoverageRequest() {
    return useCoverageAction(
        volunteerForCoverageRequest,
    )
}

export function useWithdrawCoverageResponse() {
    return useCoverageAction(
        withdrawCoverageResponse,
    )
}

export function useAcceptDirectOffer() {
    return useCoverageAction(
        acceptDirectOffer,
    )
}

export function useDeclineDirectOffer() {
    return useCoverageAction(
        declineDirectOffer,
    )
}

export function useCreateStaffCoverageRequest() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn:
            createStaffCoverageRequest,

        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: coverageQueryKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey: dashboardQueryKeys.all,
                }),
            ])
        },
    })
}

export function useCancelCoverageRequest() {
    return useCoverageAction(
        cancelCoverageRequest,
    )
}

export function useApproveAndOpenCoverageRequest() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn:
            approveAndOpenCoverageRequest,

        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey:
                        coverageQueryKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey:
                        dashboardQueryKeys.all,
                }),
            ])
        },
    })
}

export function useRejectCoverageRequest() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn:
            rejectCoverageRequest,

        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey:
                        coverageQueryKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey:
                        dashboardQueryKeys.all,
                }),
            ])
        },
    })
}

export function useCreateManagerCoverageRequest() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn:
            createManagerCoverageRequest,

        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey:
                        coverageQueryKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey:
                        dashboardQueryKeys.all,
                }),
            ])
        },
    })
}