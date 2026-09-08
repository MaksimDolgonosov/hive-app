import { File } from 'expo-file-system';
import { isAxiosError } from 'axios';
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
  comment?: string;
}

export const STING_COMMENT_MAX_LENGTH = 280;

const PUBLISH_TIMEOUT_MS = 90_000;
const PUBLISH_NETWORK_RETRIES = 2;
const PUBLISH_RETRY_DELAY_MS = 2_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveUploadUri(uri: string): string {
  if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
    return `file://${uri}`;
  }

  return uri;
}

function isRetryablePublishError(error: unknown): boolean {
  if (!isAxiosError(error) || error.response) {
    return false;
  }

  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
    return true;
  }

  const message = error.message.toLowerCase();
  return message.includes('network request failed') || message.includes('network error');
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
  hasLiked: boolean;
}

export async function react(id: string, type: 'like' = 'like'): Promise<StingReactionResponse> {
  const { data } = await apiClient.post<StingReactionResponse>(`/stings/${id}/reactions`, {
    type,
  });
  return data;
}

export async function remove(id: string): Promise<void> {
  await apiClient.delete(`/stings/${id}`);
}

export async function create(input: PublishStingInput): Promise<{ sting: Sting }> {
  const photoFile = new File(input.photoUri);

  if (!photoFile.exists) {
    throw new Error('Файл фото не найден. Переснимите снимок.');
  }

  if (__DEV__) {
    try {
      const bytes = await photoFile.bytes();
      console.log('[stings.create] prepared upload', {
        sizeKb: Math.round(bytes.byteLength / 1024),
        uri: input.photoUri,
      });
    } catch {
      // optional dev logging
    }
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

  const trimmedComment = input.comment?.trim();
  if (trimmedComment) {
    formData.append('comment', trimmedComment);
  }

  const requestConfig = {
    headers: {
      Accept: 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    timeout: PUBLISH_TIMEOUT_MS,
    transformRequest: (data: FormData, headers?: Record<string, string>) => {
      if (headers) {
        delete headers['Content-Type'];
      }
      return data;
    },
  };

  let lastError: unknown;

  for (let attempt = 0; attempt < PUBLISH_NETWORK_RETRIES; attempt += 1) {
    try {
      const { data } = await apiClient.post<{ sting: Sting }>('/stings', formData, requestConfig);
      return data;
    } catch (error) {
      lastError = error;

      if (!isRetryablePublishError(error) || attempt === PUBLISH_NETWORK_RETRIES - 1) {
        throw error;
      }

      if (__DEV__) {
        console.warn('[stings.create] retry after network error', {
          attempt: attempt + 1,
          code: isAxiosError(error) ? error.code : undefined,
        });
      }

      await delay(PUBLISH_RETRY_DELAY_MS);
    }
  }

  throw lastError;
}
