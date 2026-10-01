import type { BlockedUserSummary, SafetyReportReason, SafetyReportTarget } from '@/src/types';
import { getApiErrorCode } from '@/src/utils/api-error';

import { apiClient } from './client';

export async function reportUser(
  userId: string,
  reason: SafetyReportReason,
  comment?: string,
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>(`/users/${userId}/reports`, {
    reason,
    ...(comment ? { comment } : {}),
  });
  return data;
}

export async function reportSting(
  stingId: string,
  target: Extract<SafetyReportTarget, 'sting' | 'caption'>,
  reason: SafetyReportReason,
  comment?: string,
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>(`/stings/${stingId}/reports`, {
    reason,
    target,
    ...(comment ? { comment } : {}),
  });
  return data;
}

/** `409 CONFLICT` — скрытие уже есть, для клиента это тот же успех. */
export async function blockUser(userId: string): Promise<'created' | 'exists'> {
  try {
    await apiClient.post(`/users/${userId}/block`);
    return 'created';
  } catch (error) {
    if (getApiErrorCode(error) === 'CONFLICT') {
      return 'exists';
    }

    throw error;
  }
}

export async function unblockUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}/block`);
}

export async function listBlockedUsers(): Promise<{ users: BlockedUserSummary[] }> {
  const { data } = await apiClient.get<{ users: BlockedUserSummary[] }>('/auth/me/blocks');
  return data;
}
