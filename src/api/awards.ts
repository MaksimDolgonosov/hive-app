import { apiClient } from '@/src/api/client';
import type { AwardsPage } from '@/src/types';

export async function getMine(params?: { cursor?: string; limit?: number }): Promise<AwardsPage> {
  const { data } = await apiClient.get<AwardsPage>('/auth/me/awards', { params });
  return data;
}
