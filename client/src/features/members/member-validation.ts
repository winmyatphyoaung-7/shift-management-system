import type {
  CreateMemberInput,
  ResetMemberPasswordBody,
  StoreMember,
  UpdateMemberBody,
} from './member-types.ts'

export type ResetMemberPasswordFieldErrors =
  Partial<
    Record<
      keyof ResetMemberPasswordBody,
      string
    >
  >

export function validateResetMemberPasswordInput(
  input: ResetMemberPasswordBody,
): ResetMemberPasswordFieldErrors {
  const errors:
    ResetMemberPasswordFieldErrors = {}

  if (
    input.temporaryPassword.length < 12
  ) {
    errors.temporaryPassword =
      '仮パスワードは12文字以上で入力してください。'
  } else if (
    new TextEncoder().encode(
      input.temporaryPassword,
    ).length > 72
  ) {
    errors.temporaryPassword =
      '仮パスワードはUTF-8で72バイト以内にしてください。'
  }

  if (!input.confirmPassword) {
    errors.confirmPassword =
      '確認用パスワードを入力してください。'
  } else if (
    input.confirmPassword !==
    input.temporaryPassword
  ) {
    errors.confirmPassword =
      'パスワードが一致しません。'
  }

  return errors
}

export type CreateMemberFieldErrors =
  Partial<
    Record<
      keyof CreateMemberInput,
      string
    >
  >

export function validateCreateMemberInput(
  input: CreateMemberInput,
): CreateMemberFieldErrors {
  const errors: CreateMemberFieldErrors =
    {}

  const trimmedName =
    input.name.trim()

  if (!trimmedName) {
    errors.name =
      '氏名を入力してください。'
  } else if (trimmedName.length > 100) {
    errors.name =
      '氏名は100文字以内で入力してください。'
  }

  if (!/^\d{3}$/.test(input.loginId)) {
    errors.loginId =
      'ログインIDは3桁の数字で入力してください。'
  }

  Object.assign(
    errors,
    validateResetMemberPasswordInput({
      temporaryPassword:
        input.temporaryPassword,
      confirmPassword:
        input.confirmPassword,
    }),
  )

  return errors
}

export type EditMemberInput = Pick<
  StoreMember,
  'name' | 'loginId' | 'colorKey'
>

export type EditMemberFieldErrors =
  Partial<
    Record<
      keyof EditMemberInput,
      string
    >
  >

export function validateEditMemberInput(
  input: EditMemberInput,
): EditMemberFieldErrors {
  const errors: EditMemberFieldErrors =
    {}

  const trimmedName =
    input.name.trim()

  if (!trimmedName) {
    errors.name =
      '氏名を入力してください。'
  } else if (trimmedName.length > 100) {
    errors.name =
      '氏名は100文字以内で入力してください。'
  }

  if (!/^\d{3}$/.test(input.loginId)) {
    errors.loginId =
      'ログインIDは3桁の数字で入力してください。'
  }

  return errors
}

export function buildUpdateMemberBody(
  member: StoreMember,
  input: EditMemberInput,
): UpdateMemberBody {
  const body: UpdateMemberBody = {}

  const trimmedName =
    input.name.trim()

  if (trimmedName !== member.name) {
    body.name = trimmedName
  }

  if (
    input.loginId !== member.loginId
  ) {
    body.loginId = input.loginId
  }

  if (
    input.colorKey !== member.colorKey
  ) {
    body.colorKey = input.colorKey
  }

  return body
}