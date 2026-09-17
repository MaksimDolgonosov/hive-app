import { apiClient } from '@/src/api/client';
import type { StingsPage, UserHivesPage, UserPrivacySettings } from '@/src/types';

type CollectionParams = {
  cursor?: string;
  limit?: number;
};

export async function getMyStings(params?: CollectionParams): Promise<StingsPage> {
  const { data } = await apiClient.get<StingsPage>('/auth/me/stings', { params });
  return data;
}

export async function getMyHives(params?: CollectionParams): Promise<UserHivesPage> {
  const { data } = await apiClient.get<UserHivesPage>('/auth/me/hives', { params });
  return data;
}

export async function getLikedStings(params?: CollectionParams): Promise<StingsPage> {
  const { data } = await apiClient.get<StingsPage>('/auth/me/liked-stings', { params });
  return data;
}

const DEFAULT_PRIVACY_SETTINGS: UserPrivacySettings = {
  allowEcho: true,
  allowSharing: true,
};

function normalizePrivacySettings(value: unknown): UserPrivacySettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PRIVACY_SETTINGS;
  }

  const raw = value as Partial<UserPrivacySettings> & { settings?: UserPrivacySettings };
  const settings = raw.settings ?? raw;

  return {
    allowEcho: settings.allowEcho ?? DEFAULT_PRIVACY_SETTINGS.allowEcho,
    allowSharing: settings.allowSharing ?? DEFAULT_PRIVACY_SETTINGS.allowSharing,
  };
}

export async function getPrivacySettings(): Promise<UserPrivacySettings> {
  const { data } = await apiClient.get<unknown>('/auth/me/settings');
  return normalizePrivacySettings(data);
}

export async function updatePrivacySettings(
  patch: Partial<UserPrivacySettings>,
): Promise<UserPrivacySettings> {
  const { data } = await apiClient.patch<unknown>('/auth/me/settings', patch);
  return normalizePrivacySettings(data);
}
