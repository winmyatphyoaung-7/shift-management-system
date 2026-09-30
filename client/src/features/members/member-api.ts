import { apiClient } from '../../lib/api-client.ts'

import type {
    CreateMemberInput,
    ListMembersResponse,
    MemberResponse,
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