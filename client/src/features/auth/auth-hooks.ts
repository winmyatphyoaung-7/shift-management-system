import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  changePassword,
  getCurrentMember,
  login,
  logout,
} from './auth-api.ts'

export const authQueryKeys = {
  currentMember: [
    'auth',
    'current-member',
  ] as const,
}

export function useCurrentMember() {
  return useQuery({
    queryKey:
      authQueryKeys.currentMember,
    queryFn: getCurrentMember,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useLogin() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: login,

    onSuccess: (member) => {
      queryClient.setQueryData(
        authQueryKeys.currentMember,
        member,
      )
    },
  })
}

export function useChangePassword() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: changePassword,

    onSuccess: (member) => {
      queryClient.setQueryData(
        authQueryKeys.currentMember,
        member,
      )
    },
  })
}

export function useLogout() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: logout,

    onSuccess: () => {
      queryClient.removeQueries()
    },
  })
}