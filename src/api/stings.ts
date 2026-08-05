import { apiClient } from '@/src/api/client';
import type { MapBounds, Sting, StingsNearbyResponse } from '@/src/types';

export interface PublishStingInput {
  photoUri: string;
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: string;
  idempotencyKey: string;
}

export async function getNearby(bounds: MapBounds): Promise<StingsNearbyResponse> {
  const { data } = await apiClient.get<StingsNearbyResponse>('/stings/nearby', {
    params: {
      swLat: bounds.swLat,
      swLng: bounds.swLng,
      neLat: bounds.neLat,
      neLng: bounds.neLng,
    },
  });

  return data;
}

export async function create(input: PublishStingInput): Promise<{ sting: Sting }> {
  const formData = new FormData();
  formData.append('photo', {
    uri: input.photoUri,
    type: 'image/jpeg',
    name: 'sting.jpg',
  } as unknown as Blob);
  formData.append('lat', String(input.lat));
  formData.append('lng', String(input.lng));
  formData.append('accuracy', String(input.accuracy));
  formData.append('capturedAt', input.capturedAt);

  const { data } = await apiClient.post<{ sting: Sting }>('/stings', formData, {
    headers: {
      Accept: 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    timeout: 60_000,
    transformRequest: (data, headers) => {
      if (headers) {
        delete headers['Content-Type'];
      }
      return data;
    },
  });

  return data;
}
