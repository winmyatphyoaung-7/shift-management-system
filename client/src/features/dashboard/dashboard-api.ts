import { apiClient } from '../../lib/api-client.ts'

import type {
  ManagerDashboard,
  ManagerDashboardResponse,
  StaffDashboard,
  StaffDashboardResponse,
} from './dashboard-types.ts'

export async function getStaffDashboard(): Promise<
  StaffDashboard
> {
  const response =
    await apiClient.get<StaffDashboardResponse>(
      '/dashboard/staff',
    )

  return response.data.data.dashboard
}

export async function getManagerDashboard(): Promise<
  ManagerDashboard
> {
  const response =
    await apiClient.get<ManagerDashboardResponse>(
      '/dashboard/manager',
    )

  return response.data.data.dashboard
}