import {
  Navigate,
  Outlet,
} from 'react-router'

import { useCurrentMember } from './auth-hooks.ts'

export function RequireManager() {
  const { data: member } =
    useCurrentMember()

  if (!member) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (member.role !== 'MANAGER') {
    return (
      <Navigate
        to="/schedule"
        replace
      />
    )
  }

  return <Outlet />
}