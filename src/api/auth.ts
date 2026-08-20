import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import type { AuthSession, AuthTokens, ProfileOverview, User } from '@/src/types';

import { apiClient } from './client';

function resolveUploadUri(uri: string): string {
  if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
    return `file://${uri}`;
  }

  return uri;
}

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

export async function getProfileOverview(): Promise<ProfileOverview> {
  const { data } = await apiClient.get<ProfileOverview>('/auth/me/stats');
  return data;
}

export async function uploadAvatar(photoUri: string): Promise<{ user: User }> {
  const photoFile = new File(photoUri);
  const uploadUri = photoFile.exists
    ? resolveUploadUri(photoFile.uri)
    : resolveUploadUri(photoUri);

  const formData = new FormData();
  formData.append('avatar', {
    uri: uploadUri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
  } as unknown as Blob);

  const { data } = await apiClient.post<{ user: User }>('/auth/me/avatar', formData, {
    headers: {
      Accept: 'application/json',
    },
    timeout: 60_000,
    transformRequest: (payload, headers) => {
      if (headers) {
        delete headers['Content-Type'];
      }
      return payload;
    },
  });

  return data;
}

export async function removeAvatar(): Promise<{ user: User }> {
  const { data } = await apiClient.delete<{ user: User }>('/auth/me/avatar');
  return data;
}
