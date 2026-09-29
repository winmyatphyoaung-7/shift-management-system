import { useQuery } from '@tanstack/react-query'

import { getMembers } from './member-api.ts'

export const memberQueryKeys = {
  all: ['members'] as const,

  list: [
    'members',
    'list',
  ] as const,
}

export function useMembers() {
  return useQuery({
    queryKey: memberQueryKeys.list,
    queryFn: getMembers,
    staleTime: 60 * 1000,
    retry: false,
  })
}