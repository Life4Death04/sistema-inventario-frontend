import { isAxiosError } from 'axios'

import type { ApiErrorEnvelope } from '@/types/api.types'

const DEMO_READ_ONLY_ERROR_CODE = 'DEMO_READ_ONLY'

export function getDemoReadOnlyErrorMessage(error: unknown, localizedMessage: string) {
  if (!isAxiosError<ApiErrorEnvelope>(error)) {
    return null
  }

  return error.response?.data.error?.toUpperCase() === DEMO_READ_ONLY_ERROR_CODE
    ? localizedMessage
    : null
}
