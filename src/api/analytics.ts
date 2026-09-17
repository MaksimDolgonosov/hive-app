import { apiClient } from '@/src/api/client';
import type { AnalyticsEvent } from '@/src/types';

/** Максимум событий в одном запросе (§G12). */
export const ANALYTICS_BATCH_SIZE = 50;

export async function sendEvents(events: AnalyticsEvent[], deviceId: string): Promise<void> {
  await apiClient.post('/analytics/events', { events }, { headers: { 'X-Device-Id': deviceId } });
}
