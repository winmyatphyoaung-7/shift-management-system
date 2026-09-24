import {
  Navigate,
  Outlet,
} from 'react-router'

import { useCurrentMember } from './auth-hooks.ts'

export function RequirePasswordChanged() {
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

  if (member.mustChangePassword) {
    return (
      <Navigate
        to="/change-password"
        replace
      />
    )
  }

  return <Outlet />
}