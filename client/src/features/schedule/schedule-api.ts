import { apiClient } from '../../lib/api-client.ts'

import type {
    ListScheduleDaysResponse,
    ScheduleDateRange,
    ScheduleDay,
    CreateShiftsInput,
    CreateShiftsResponse,
    CreateShiftsResult,
} from './schedule-types.ts'

export async function getScheduleDays(
    range: ScheduleDateRange,
): Promise<ScheduleDay[]> {
    const response =
        await apiClient.get<ListScheduleDaysResponse>(
            '/schedule-days',
            {
                params: range,
            },
        )

    return response.data.data.scheduleDays
}

export async function createShifts(
    input: CreateShiftsInput,
): Promise<CreateShiftsResult> {
    const response =
        await apiClient.post<CreateShiftsResponse>(
            '/shifts',
            input,
        )

    return response.data.data
}