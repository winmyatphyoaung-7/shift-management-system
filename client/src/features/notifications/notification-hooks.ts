import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notification-api.ts'

export const notificationQueryKeys = {
  all: ['notifications'] as const,

  list: [
    'notifications',
    'list',
  ] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationQueryKeys.list,
    queryFn: getNotifications,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  })
}

export function useMarkNotificationRead() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          notificationQueryKeys.list,
      })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsRead,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          notificationQueryKeys.list,
      })
    },
  })
}