import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createMember,
  getMembers,
  updateMember,
  resetMemberPassword,
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

export function useUpdateMember() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: updateMember,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          memberQueryKeys.list,
      })
    },
  })
}

export function useResetMemberPassword() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: resetMemberPassword,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          memberQueryKeys.list,
      })
    },
  })
}
