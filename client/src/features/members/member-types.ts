import type { ApiSuccessResponse } from '../../types/api.ts'
import type { MemberRole } from '../auth/auth-types.ts'

export const MEMBER_COLOR_KEYS = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'zinc',
  'stone',
] as const

export type MemberColorKey =
  (typeof MEMBER_COLOR_KEYS)[number]

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
  colorKey: MemberColorKey
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
}

export type CreateMemberInput = {
  name: string
  loginId: string
  temporaryPassword: string
  confirmPassword: string
  colorKey: MemberColorKey
}

export type UpdateMemberBody = {
  name?: string
  loginId?: string
  colorKey?: MemberColorKey
}

export type UpdateMemberInput = {
  memberId: string
  body: UpdateMemberBody
}

export type ListMembersResponse =
  ApiSuccessResponse<{
    members: StoreMember[]
  }>

export type MemberResponse =
  ApiSuccessResponse<{
    member: StoreMember
  }>