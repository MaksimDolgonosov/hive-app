import { File } from 'expo-file-system';
import { Platform } from 'react-native';

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

function resolveUploadUri(uri: string): string {
  if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
    return `file://${uri}`;
  }

  return uri;
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

export async function getById(id: string): Promise<{ sting: Sting }> {
  const { data } = await apiClient.get<{ sting: Sting }>(`/stings/${id}`);
  return data;
}

export interface StingReactionResponse {
  reactionsCount: number;
  hasLiked?: boolean;
}

export async function react(id: string, type: 'like' = 'like'): Promise<StingReactionResponse> {
  const { data } = await apiClient.post<StingReactionResponse>(`/stings/${id}/reactions`, {
    type,
  });
  return data;
}

export async function create(input: PublishStingInput): Promise<{ sting: Sting }> {
  const photoFile = new File(input.photoUri);

  if (!photoFile.exists) {
    throw new Error('Файл фото не найден. Переснимите снимок.');
  }

  const formData = new FormData();
  formData.append('photo', {
    uri: resolveUploadUri(photoFile.uri),
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
    timeout: 90_000,
    transformRequest: (data, headers) => {
      if (headers) {
        delete headers['Content-Type'];
      }
      return data;
    },
  });

  return data;
}
