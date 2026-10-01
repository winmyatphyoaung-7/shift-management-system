import { apiClient } from '../../lib/api-client.ts'
import type { ApiMessageResponse } from '../../types/api.ts'

import type {
  CreateMemberInput,
  ListMembersResponse,
  MemberResponse,
  ResetMemberPasswordInput,
  StoreMember,
  UpdateMemberInput,
  DeactivateMemberInput,
} from './member-types.ts'


export async function getMembers(): Promise<
  StoreMember[]
> {
  const response =
    await apiClient.get<ListMembersResponse>(
      '/members',
    )

  return response.data.data.members
}

export async function createMember(
  input: CreateMemberInput,
): Promise<StoreMember> {
  const response =
    await apiClient.post<MemberResponse>(
      '/members',
      input,
    )

  return response.data.data.member
}

export async function updateMember({
  memberId,
  body,
}: UpdateMemberInput): Promise<StoreMember> {
  const response =
    await apiClient.patch<MemberResponse>(
      `/members/${memberId}`,
      body,
    )

  return response.data.data.member
}

export async function resetMemberPassword({
  memberId,
  body,
}: ResetMemberPasswordInput): Promise<string> {
  const response =
    await apiClient.post<ApiMessageResponse>(
      `/members/${memberId}/reset-password`,
      body,
    )

  return response.data.message
}

export async function deactivateMember({
  memberId,
}: DeactivateMemberInput): Promise<string> {
  const response =
    await apiClient.post<ApiMessageResponse>(
      `/members/${memberId}/deactivate`,
    )

  return response.data.message
}