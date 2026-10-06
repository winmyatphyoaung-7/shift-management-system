import { apiClient } from '../../lib/api-client.ts'

import type {
    ListScheduleDaysResponse,
    ScheduleDateRange,
    ScheduleDay,
    CreateShiftsInput,
    CreateShiftsResponse,
    CreateShiftsResult,
    UpdateShiftInput,
    UpdateShiftResponse,
    RemoveShiftInput,
    PublishScheduleInput,
    PublishScheduleResponse,
    PublishScheduleResult,
} from './schedule-types.ts'

import type {
    ApiMessageResponse,
} from '../../types/api.ts'

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

export async function updateShift({
    shiftId,
    body,
}: UpdateShiftInput) {
    const response =
        await apiClient.patch<UpdateShiftResponse>(
            `/shifts/${shiftId}`,
            body,
        )

    return response.data.data
}

export async function removeShift({
    shiftId,
}: RemoveShiftInput): Promise<string> {
    const response =
        await apiClient.delete<ApiMessageResponse>(
            `/shifts/${shiftId}`,
        )

    return response.data.message
}

export async function publishSchedule(
    input: PublishScheduleInput,
): Promise<PublishScheduleResult> {
    const response =
        await apiClient.post<PublishScheduleResponse>(
            '/schedule-days/publish',
            input,
        )

    return response.data.data
}