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
