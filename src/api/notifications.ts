import { apiClient } from '@/src/api/client';
import type { NotificationSettings } from '@/src/types';

export async function getSettings(): Promise<NotificationSettings> {
  const { data } = await apiClient.get<{ settings: NotificationSettings }>(
    '/notifications/settings',
  );
  return data.settings;
}

export async function updateSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const { data } = await apiClient.patch<{ settings: NotificationSettings }>(
    '/notifications/settings',
    patch,
  );
  return data.settings;
}
