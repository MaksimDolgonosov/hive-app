import { create, isAxiosError } from 'axios';
import { Platform } from 'react-native';

import { getAccessToken, refreshAccessTokenViaSession } from '@/src/api/auth-session';
import { env } from '@/src/config/env';

export const apiClient = create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  // RN Android: xhr-адаптер иногда даёт ERR_NETWORK без response; fetch стабильнее.
  ...(Platform.OS !== 'web' ? { adapter: 'fetch' as const } : {}),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

function getOrCreateRefreshPromise(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessTokenViaSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function isFormDataPayload(data: unknown): boolean {
  return typeof FormData !== 'undefined' && data instanceof FormData;
}

apiClient.interceptors.request.use((config) => {
  if (!config.skipAuthRefresh) {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  // fetch-адаптер не отправляет file:// multipart в RN — для FormData нужен xhr.
  if (Platform.OS !== 'web' && isFormDataPayload(config.data)) {
    config.adapter = 'xhr';
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const shouldSkipRefresh = originalRequest.skipAuthRefresh || originalRequest._retry;

    if (!isUnauthorized || shouldSkipRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const accessToken = await getOrCreateRefreshPromise();
    if (!accessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return apiClient(originalRequest);
  },
);

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}
