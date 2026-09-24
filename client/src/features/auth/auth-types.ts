import type {
  ApiMessageResponse,
  ApiSuccessResponse,
} from '../../types/api.ts'

export type MemberRole =
  | 'MANAGER'
  | 'STAFF'

export type AuthenticatedMember = {
  userId: string
  membershipId: string
  storeId: string
  loginId: string
  name: string
  role: MemberRole
  mustChangePassword: boolean
}

export type LoginInput = {
  loginId: string
  password: string
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type AuthMemberResponse =
  ApiSuccessResponse<{
    member: AuthenticatedMember
  }>

export type LogoutResponse =
  ApiMessageResponse