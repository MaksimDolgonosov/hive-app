import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import type {
  AuthSession,
  AuthTokens,
  ForgotPasswordInput,
  OtpChallengeResponse,
  ProfileOverview,
  ResendOtpInput,
  ResetPasswordInput,
  UpdateProfileInput,
  User,
  VerifyOtpInput,
} from '@/src/types';

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
}): Promise<OtpChallengeResponse> {
  const { data } = await apiClient.post<OtpChallengeResponse>('/auth/register', input, {
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

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthSession>('/auth/otp/verify', input, {
    skipAuthRefresh: true,
  });
  return data;
}

export async function resendOtp(input: ResendOtpInput): Promise<OtpChallengeResponse> {
  const { data } = await apiClient.post<OtpChallengeResponse>('/auth/otp/resend', input, {
    skipAuthRefresh: true,
  });
  return data;
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<OtpChallengeResponse> {
  const { data } = await apiClient.post<OtpChallengeResponse>('/auth/password/forgot', input, {
    skipAuthRefresh: true,
  });
  return data;
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return Boolean(session.user && session.tokens?.accessToken && session.tokens.refreshToken);
}

export async function resetPassword(input: ResetPasswordInput): Promise<AuthSession | void> {
  const { data, status } = await apiClient.post<AuthSession | string | undefined>(
    '/auth/password/reset',
    input,
    { skipAuthRefresh: true },
  );

  if (status === 204 || !isAuthSession(data)) {
    return undefined;
  }

  return data;
}

export async function loginWithGoogle(input: { idToken: string }): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthSession>('/auth/google', input, {
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
  const uploadUri = photoFile.exists ? resolveUploadUri(photoFile.uri) : resolveUploadUri(photoUri);

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

export async function updateProfile(input: UpdateProfileInput): Promise<{ user: User }> {
  const { data } = await apiClient.patch<{ user: User }>('/auth/me', input);
  return data;
}
