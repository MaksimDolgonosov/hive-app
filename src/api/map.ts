import { apiClient } from '@/src/api/client';
import type { MapBounds, MapOverviewResponse } from '@/src/types';

export async function getOverview(bounds: MapBounds, zoom: number): Promise<MapOverviewResponse> {
  const { data } = await apiClient.get<MapOverviewResponse>('/map/overview', {
    params: {
      swLat: bounds.swLat,
      swLng: bounds.swLng,
      neLat: bounds.neLat,
      neLng: bounds.neLng,
      zoom,
    },
  });

  return data;
}
