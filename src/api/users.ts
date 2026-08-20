import type { PublicUserProfile } from '@/src/types';

import { apiClient } from './client';

export async function getPublicProfile(userId: string): Promise<PublicUserProfile> {
  const { data } = await apiClient.get<PublicUserProfile>(`/users/${userId}`);
  return data;
}
