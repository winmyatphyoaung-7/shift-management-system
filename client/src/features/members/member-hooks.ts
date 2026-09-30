import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createMember,
  getMembers,
} from './member-api.ts'

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

export function useCreateMember() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: createMember,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          memberQueryKeys.list,
      })
    },
  })
}