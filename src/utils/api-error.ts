import { isAxiosError } from 'axios';

import i18n from '@/src/i18n';
import type { ApiErrorBody } from '@/src/types';

export function getApiErrorMessage(error: unknown, fallbackKey = 'errors.generic'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return i18n.t('errors.timeout');
      }

      return i18n.t('errors.network');
    }

    const apiError = error.response.data?.error;
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

    if (apiError?.message) {
      return apiError.message;
    }

    return i18n.t('errors.httpStatus', { status: error.response.status });
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return i18n.t(fallbackKey);
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return undefined;
  }

  return error.response?.data?.error?.code;
}

export function getApiErrorDetails(error: unknown): Record<string, unknown> | undefined {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return undefined;
  }

  return error.response?.data?.error?.details;
}

export function getApiErrorDetailString(error: unknown, key: string): string | undefined {
  const value = getApiErrorDetails(error)?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getApiErrorRetryAfterSec(error: unknown): number | undefined {
  const value = getApiErrorDetails(error)?.retryAfterSec;

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return Math.ceil(value);
}

/** Логирует детали ошибки API в dev-сборке. */
export function logApiError(scope: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }

  if (isAxiosError<ApiErrorBody>(error)) {
    console.warn(`[${scope}] API error`, {
      code: error.code,
      status: error.response?.status,
      url: error.config?.baseURL
        ? `${error.config.baseURL.replace(/\/$/, '')}${error.config.url ?? ''}`
        : error.config?.url,
      apiError: error.response?.data?.error,
      message: error.message,
    });
    return;
  }

  console.warn(`[${scope}] error`, error);
}
