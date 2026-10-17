import { useQuery } from '@tanstack/react-query'

import {
  getManagerDashboard,
  getStaffDashboard,
} from './dashboard-api.ts'

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,

  staff: [
    'dashboard',
    'staff',
  ] as const,

  manager: [
    'dashboard',
    'manager',
  ] as const,
}

export function useStaffDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.staff,
    queryFn: getStaffDashboard,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  })
}

export function useManagerDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.manager,
    queryFn: getManagerDashboard,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  })
}