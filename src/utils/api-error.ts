import { isAxiosError } from 'axios';

import i18n from '@/src/i18n';
import type { ApiErrorBody } from '@/src/types';

export function getApiErrorMessage(error: unknown, fallbackKey = 'errors.generic'): string {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return error instanceof Error ? error.message : i18n.t(fallbackKey);
  }

  const apiError = error.response?.data?.error;
  const code = apiError?.code;
  const reason = apiError?.details?.reason;

  if (typeof reason === 'string') {
    const reasonKey = `errors.${reason}`;
    if (i18n.exists(reasonKey)) {
      return i18n.t(reasonKey);
    }
  }

  if (code) {
    const key = `errors.${code}`;
    if (i18n.exists(key)) {
      return i18n.t(key);
    }
  }

  return apiError?.message ?? i18n.t(fallbackKey);
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return undefined;
  }

  return error.response?.data?.error?.code;
}
