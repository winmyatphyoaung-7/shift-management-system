import { apiClient } from '../../lib/api-client.ts'

import type {
  AuthenticatedMember,
  AuthMemberResponse,
  ChangePasswordInput,
  LoginInput,
  LogoutResponse,
} from './auth-types.ts'

export async function login(
  input: LoginInput,
): Promise<AuthenticatedMember> {
  const response =
    await apiClient.post<AuthMemberResponse>(
      '/auth/login',
      input,
    )
  return response.data.data.member
}

export async function getCurrentMember(): Promise<AuthenticatedMember> {
  const response =
    await apiClient.get<AuthMemberResponse>(
      '/auth/me',
    )

  return response.data.data.member
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<AuthenticatedMember> {
  const response =
    await apiClient.post<AuthMemberResponse>(
      '/auth/change-password',
      input,
    )

  return response.data.data.member
}

export async function logout(): Promise<string> {
  const response =
    await apiClient.post<LogoutResponse>(
      '/auth/logout',
    )

  return response.data.message
}