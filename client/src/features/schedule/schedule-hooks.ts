import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import {
    createShifts,
    getScheduleDays,
    updateShift,
    removeShift,
    publishSchedule,
} from './schedule-api.ts'
import type { ScheduleDateRange } from './schedule-types.ts'

export const scheduleQueryKeys = {
    all: ['schedule-days'] as const,

    list: (
        range: ScheduleDateRange,
    ) =>
        [
            'schedule-days',
            'list',
            range.from,
            range.to,
        ] as const,
}

export function useScheduleDays(
    range: ScheduleDateRange,
) {
    return useQuery({
        queryKey:
            scheduleQueryKeys.list(range),
        queryFn: () =>
            getScheduleDays(range),
        staleTime: 30 * 1000,
        retry: false,
    })
}

export function useCreateShifts() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn: createShifts,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey:
                    scheduleQueryKeys.all,
            })
        },
    })
}

export function useUpdateShift() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn: updateShift,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey:
                    scheduleQueryKeys.all,
            })
        },
    })
}

export function useRemoveShift() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn: removeShift,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey:
                    scheduleQueryKeys.all,
            })
        },
    })
}

export function usePublishSchedule() {
    const queryClient =
        useQueryClient()

    return useMutation({
        mutationFn: publishSchedule,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey:
                    scheduleQueryKeys.all,
            })
        },
    })
}