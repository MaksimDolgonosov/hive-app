import type { AuthSession, AuthTokens, User } from '@/src/types';

import { apiClient } from './client';

export async function register(input: {
  email: string;
  password: string;
  username: string;
}): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthSession>('/auth/register', input, {
    skipAuthRefresh: true,
  });
  return data;
}

export async function login(input: { email: string; password: string }): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthSession>('/auth/login', input, {
    skipAuthRefresh: true,
  });
  return data;
}

export async function refresh(refreshToken: string): Promise<{ tokens: AuthTokens }> {
  const { data } = await apiClient.post<{ tokens: AuthTokens }>(
    '/auth/refresh',
    { refreshToken },
    { skipAuthRefresh: true },
  );
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function getMe(): Promise<{ user: User }> {
  const { data } = await apiClient.get<{ user: User }>('/auth/me');
  return data;
}
