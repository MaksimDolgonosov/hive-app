import AsyncStorage from '@react-native-async-storage/async-storage';

import { ANALYTICS_BATCH_SIZE, sendEvents } from '@/src/api/analytics';
import type { AnalyticsEvent, AnalyticsEventName } from '@/src/types';
import { getDeviceId } from '@/src/utils/device-id';

const QUEUE_KEY = '@hive/analyticsQueue';
const MAX_BUFFER = 500;
const MAX_EVENT_AGE_MS = 24 * 60 * 60_000;
const FLUSH_DEBOUNCE_MS = 3_000;

let buffer: AnalyticsEvent[] = [];
let isHydrated = false;
let isFlushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let sessionStartSent = false;

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(buffer));
  } catch {
    // Аналитика не должна влиять на работу приложения.
  }
}

function isFresh(event: AnalyticsEvent): boolean {
  return Date.now() - new Date(event.occurredAt).getTime() < MAX_EVENT_AGE_MS;
}

async function hydrate(): Promise<void> {
  if (isHydrated) {
    return;
  }

  isHydrated = true;

  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) {
      buffer = (JSON.parse(raw) as AnalyticsEvent[]).filter(isFresh);
    }
  } catch {
    buffer = [];
  }
}

function scheduleFlush(): void {
  if (flushTimer) {
    return;
  }

  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushAnalyticsQueue();
  }, FLUSH_DEBOUNCE_MS);
}

/**
 * Кладёт событие в очередь. Персональные данные в `props` запрещены (§G12):
 * ни email, ни точных координат, ни `authorId` — гео только как `zoneId`.
 */
export function trackEvent(
  name: AnalyticsEventName,
  payload?: { zoneId?: string; props?: AnalyticsEvent['props'] },
): void {
  void (async () => {
    await hydrate();

    buffer.push({
      name,
      occurredAt: new Date().toISOString(),
      ...(payload?.zoneId ? { zoneId: payload.zoneId } : {}),
      ...(payload?.props ? { props: payload.props } : {}),
    });

    // Переполнение сбрасывает самые старые события, а не самые свежие.
    if (buffer.length > MAX_BUFFER) {
      buffer = buffer.slice(buffer.length - MAX_BUFFER);
    }

    await persist();
    scheduleFlush();
  })();
}

/** Отправляет накопленные события пачками. Вызывается при появлении сети. */
export async function flushAnalyticsQueue(): Promise<void> {
  if (isFlushing) {
    return;
  }

  await hydrate();

  buffer = buffer.filter(isFresh);
  if (buffer.length === 0) {
    return;
  }

  isFlushing = true;

  try {
    const deviceId = await getDeviceId();

    while (buffer.length > 0) {
      const batch = buffer.slice(0, ANALYTICS_BATCH_SIZE);
      await sendEvents(batch, deviceId);
      buffer = buffer.slice(batch.length);
      await persist();
    }
  } catch {
    // Офлайн или ошибка сервера — события остаются в буфере до следующей попытки.
  } finally {
    isFlushing = false;
  }
}

export function hasTrackedSessionStart(): boolean {
  return sessionStartSent;
}

export function trackSessionStartOnce(payload: {
  zoneId?: string;
  props: NonNullable<AnalyticsEvent['props']>;
}): void {
  if (sessionStartSent) {
    return;
  }

  sessionStartSent = true;
  trackEvent('session_start', payload);
}
