import { apiClient } from '../../lib/api-client.ts'

import type {
  ListScheduleDaysResponse,
  ScheduleDateRange,
  ScheduleDay,
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