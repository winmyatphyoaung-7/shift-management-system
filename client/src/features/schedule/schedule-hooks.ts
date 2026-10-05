import { useQuery } from '@tanstack/react-query'

import { getScheduleDays } from './schedule-api.ts'
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