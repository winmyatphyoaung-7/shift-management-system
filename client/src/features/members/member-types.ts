import type { ApiSuccessResponse } from '../../types/api.ts'
import type { MemberRole } from '../auth/auth-types.ts'

export type MemberStatus =
  | 'ACTIVE'
  | 'INACTIVE'

export type StoreMember = {
  id: string
  userId: string
  loginId: string
  name: string
  role: MemberRole
  status: MemberStatus
  colorKey: string
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

export type ListMembersResponse =
  ApiSuccessResponse<{
    members: StoreMember[]
  }>