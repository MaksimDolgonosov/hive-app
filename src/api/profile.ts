import { apiClient } from '@/src/api/client';
import type { StingsPage, UserHivesPage } from '@/src/types';

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
