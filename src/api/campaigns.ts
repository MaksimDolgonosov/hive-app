import { apiClient } from '@/src/api/client';
import type { ActiveCampaignsResponse } from '@/src/types';

export async function getActive(coords: {
  lat: number;
  lng: number;
}): Promise<ActiveCampaignsResponse> {
  const { data } = await apiClient.get<ActiveCampaignsResponse>('/campaigns/active', {
    params: { lat: coords.lat, lng: coords.lng },
  });

  return data;
}
