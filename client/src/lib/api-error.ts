import { isAxiosError } from 'axios'

import type { ApiErrorResponse } from '../types/api.ts'

export function toApiError(
  error: unknown,
): ApiErrorResponse {
  if (isAxiosError<ApiErrorResponse>(error)) {
    console.log(error.response?.data);
    const responseData =
      error.response?.data

    if (
      responseData?.status === 'error' &&
      typeof responseData.code ===
        'string' &&
      typeof responseData.message ===
        'string'
    ) {
      return responseData
    }

    if (error.code === 'ECONNABORTED') {
      return {
        status: 'error',
        code: 'REQUEST_TIMEOUT',
        message:
          'The server took too long to respond',
      }
    }

    if (!error.response) {
      return {
        status: 'error',
        code: 'NETWORK_ERROR',
        message:
          'Unable to connect to the server',
      }
    }
  }

  return {
    status: 'error',
    code: 'UNKNOWN_ERROR',
    message:
      'An unexpected error occurred',
  }
}