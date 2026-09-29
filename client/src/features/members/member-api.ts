import { apiClient } from '../../lib/api-client.ts'

import type {
  ListMembersResponse,
  StoreMember,
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