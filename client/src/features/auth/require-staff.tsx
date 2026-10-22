import {
  Navigate,
  Outlet,
} from 'react-router'

import { useCurrentMember } from './auth-hooks.ts'

export function RequireStaff() {
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

  if (member.role !== 'STAFF') {
    return (
      <Navigate
        to="/manager"
        replace
      />
    )
  }

  return <Outlet />
}