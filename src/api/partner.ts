import { apiClient } from '@/src/api/client';
import { jpegFormFile, multipartRequestConfig } from '@/src/api/multipart';
import type { PartnerApplication, PlaceCategory } from '@/src/types';

export interface ApplicationDraftInput {
  brandName?: string;
  category?: PlaceCategory;
    address?: {
    formatted?: string;
    city?: string | null;
    country?: string | null;
    lat?: number;
    lng?: number;
  };
  phone?: string | null;
  contactEmail?: string;
  listingUrls?: {
    instagram?: string | null;
    website?: string | null;
    ymaps?: string | null;
    twogis?: string | null;
  };
}

export async function createApplication(input: ApplicationDraftInput): Promise<PartnerApplication> {
  const { data } = await apiClient.post<{ application: PartnerApplication }>('/partner/applications', input);
  return data.application;
}

export async function listApplications(): Promise<PartnerApplication[]> {
  const { data } = await apiClient.get<{ applications: PartnerApplication[] }>('/partner/applications/me');
  return data.applications;
}

export async function updateApplication(id: string, input: ApplicationDraftInput): Promise<PartnerApplication> {
  const { data } = await apiClient.patch<{ application: PartnerApplication }>(
    `/partner/applications/${id}`,
    input,
  );
  return data.application;
}

export async function uploadOnsite(input: {
  applicationId: string;
  photoUri: string;
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: string;
}): Promise<PartnerApplication> {
  const formData = new FormData();
  formData.append('photo', jpegFormFile(input.photoUri, 'onsite.jpg') as unknown as Blob);
  formData.append('lat', String(input.lat));
  formData.append('lng', String(input.lng));
  formData.append('accuracy', String(input.accuracy));
  formData.append('capturedAt', input.capturedAt);

  const { data } = await apiClient.post<{ application: PartnerApplication }>(
    `/partner/applications/${input.applicationId}/onsite`,
    formData,
    multipartRequestConfig(),
  );
  return data.application;
}

export async function submitApplication(
  id: string,
  coords: { lat: number; lng: number },
): Promise<{ application: PartnerApplication; placeId: string }> {
  const { data } = await apiClient.post<{ application: PartnerApplication; placeId: string }>(
    `/partner/applications/${id}/submit`,
    coords,
  );
  return data;
}
