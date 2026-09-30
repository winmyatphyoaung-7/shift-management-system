import type { CreateMemberInput } from './member-types.ts'

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