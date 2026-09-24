export type ApiSuccessResponse<T> = {
  status: 'success'
  message?: string
  data: T
}

export type ApiMessageResponse = {
  status: 'success'
  message: string
}

export type ApiErrorResponse = {
  status: 'error'
  code: string
  message: string
  details?: unknown
}