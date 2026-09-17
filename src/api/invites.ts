import { apiClient } from '@/src/api/client';
import type { CreatedInvite, MyInvitesResponse, PublicInviteResponse } from '@/src/types';

export async function create(): Promise<CreatedInvite> {
  const { data } = await apiClient.post<CreatedInvite>('/invites');
  return data;
}

export async function getMine(): Promise<MyInvitesResponse> {
  const { data } = await apiClient.get<MyInvitesResponse>('/invites/me');
  return data;
}

/** Публичная проверка кода: без токена, ошибка не ломает регистрацию (§G8). */
export async function getPublic(code: string): Promise<PublicInviteResponse> {
  const { data } = await apiClient.get<PublicInviteResponse>(`/invites/${code}`, {
    skipAuthRefresh: true,
  });
  return data;
}
