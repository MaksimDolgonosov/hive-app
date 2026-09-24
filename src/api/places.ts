import { apiClient } from '@/src/api/client';
import { jpegFormFile, multipartRequestConfig } from '@/src/api/multipart';
import type {
  Place,
  PlaceCategory,
  PlaceMediaKind,
  PlaceMediaSource,
  PlaceReportReason,
  Sting,
  UserSocialLinks,
} from '@/src/types';

export async function getPlace(id: string): Promise<{ place: Place; viewerIsOwner: boolean }> {
  const { data } = await apiClient.get<{ place: Place; viewerIsOwner: boolean }>(`/places/${id}`);
  return data;
}

export async function listMyPlaces(): Promise<Place[]> {
  const { data } = await apiClient.get<{ places: Place[] }>('/places/me');
  return data.places;
}

export async function updatePlace(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    category?: PlaceCategory;
    phone?: string | null;
    address?: { formatted?: string; city?: string | null; country?: string | null };
    socialLinks?: Partial<UserSocialLinks> | null;
  },
): Promise<Place> {
  const { data } = await apiClient.patch<{ place: Place }>(`/places/${id}`, input);
  return data.place;
}

export async function pausePlace(id: string): Promise<Place> {
  const { data } = await apiClient.post<{ place: Place }>(`/places/${id}/pause`);
  return data.place;
}

export async function resumePlace(id: string): Promise<Place> {
  const { data } = await apiClient.post<{ place: Place }>(`/places/${id}/resume`);
  return data.place;
}

export async function uploadPlaceMedia(input: {
  placeId: string;
  photoUri: string;
  kind: PlaceMediaKind;
  source: PlaceMediaSource;
}): Promise<{ place: Place; wentLive: boolean }> {
  const formData = new FormData();
  formData.append('photo', jpegFormFile(input.photoUri, 'place.jpg') as unknown as Blob);
  formData.append('kind', input.kind);
  formData.append('source', input.source);
  const { data } = await apiClient.post<{ place: Place; wentLive: boolean }>(
    `/places/${input.placeId}/media`,
    formData,
    multipartRequestConfig(),
  );
  return data;
}

export async function deletePlaceMedia(placeId: string, mediaId: string): Promise<Place> {
  const { data } = await apiClient.delete<{ place: Place }>(`/places/${placeId}/media/${mediaId}`);
  return data.place;
}

export async function getPlaceStings(
  id: string,
  cursor?: string | null,
): Promise<{ stings: Sting[]; nextCursor: string | null }> {
  const { data } = await apiClient.get<{ stings: Sting[]; nextCursor: string | null }>(`/places/${id}/stings`, {
    params: { ...(cursor ? { cursor } : {}), includePartner: false },
  });
  return data;
}

export async function reportPlace(
  id: string,
  reason: PlaceReportReason,
  comment?: string,
): Promise<void> {
  await apiClient.post(`/places/${id}/reports`, { reason, comment });
}

export function placeShareUrl(id: string): string {
  return `https://hive.app/p/${id}`;
}
