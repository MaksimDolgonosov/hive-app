import { apiClient } from '@/src/api/client';
import type { HiveDetailResponse, HiveStingsPageResponse } from '@/src/types';

export async function getById(id: string): Promise<HiveDetailResponse> {
  const { data } = await apiClient.get<HiveDetailResponse>(`/hives/${id}`);
  return data;
}

export async function getStings(
  id: string,
  params?: { cursor?: string; limit?: number },
): Promise<HiveStingsPageResponse> {
  const { data } = await apiClient.get<HiveStingsPageResponse>(`/hives/${id}/stings`, {
    params,
  });
  return data;
}
