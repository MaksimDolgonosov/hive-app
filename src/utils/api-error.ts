import { isAxiosError } from 'axios';

import i18n from '@/src/i18n';
import type { ApiErrorBody } from '@/src/types';

export function getApiErrorMessage(error: unknown, fallbackKey = 'errors.generic'): string {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return error instanceof Error ? error.message : i18n.t(fallbackKey);
  }

  const code = error.response?.data?.error?.code;
  if (code) {
    const key = `errors.${code}`;
    if (i18n.exists(key)) {
      return i18n.t(key);
    }
  }

  return error.response?.data?.error?.message ?? i18n.t(fallbackKey);
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return undefined;
  }

  return error.response?.data?.error?.code;
}
