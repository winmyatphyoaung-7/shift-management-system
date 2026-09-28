import { Navigate } from 'react-router'

import { useCurrentMember } from './auth-hooks.ts'

export function AuthenticatedHomeRedirect() {
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

  return (
    <Navigate
      to={
        member.role === 'MANAGER'
          ? '/manager'
          : '/schedule'
      }
      replace
    />
  )
}