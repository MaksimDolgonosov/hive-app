import { create, isAxiosError } from 'axios';

import { env } from '@/src/config/env';
import * as authApi from '@/src/api/auth';
import { useAuthStore } from '@/src/stores/authStore';

export const apiClient = create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clearSession } = useAuthStore.getState();

  if (!refreshToken) {
    await clearSession();
    return null;
  }

  try {
    const { tokens } = await authApi.refresh(refreshToken);
    await setTokens(tokens);
    return tokens.accessToken;
  } catch {
    await clearSession();
    return null;
  }
}

function getOrCreateRefreshPromise(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
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
