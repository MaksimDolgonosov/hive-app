import { apiClient } from '@/src/api/client';
import type { WaitlistResponse, Zone } from '@/src/types';

/**
 * Фактическая зона и её TTL до съёмки (§G1). Ответ — тот же TTL, который
 * применится при публикации, поэтому UI обязан показывать именно его,
 * а не зашитое значение.
 */
export async function getCurrentZone(coords: { lat: number; lng: number }): Promise<Zone> {
  const { data } = await apiClient.get<{ zone: Zone }>('/zones/current', {
    params: { lat: coords.lat, lng: coords.lng },
  });

  return data.zone;
}

export async function joinWaitlist(input: {
  lat: number;
  lng: number;
  email?: string;
}): Promise<WaitlistResponse> {
  const { data } = await apiClient.post<WaitlistResponse>('/waitlist', input);
  return data;
}
