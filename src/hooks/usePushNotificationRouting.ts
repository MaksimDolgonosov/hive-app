import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useMapStore } from '@/src/stores/mapStore';
import { trackEvent } from '@/src/utils/analytics-queue';
import { hrefForDeeplink, parseDeeplink } from '@/src/utils/deeplink';
import { getPushNatives } from '@/src/utils/push-device';

function openFromNotification(rawDeeplink: string | undefined): void {
  const parsed = parseDeeplink(rawDeeplink);
  trackEvent('push_opened', {
    props: { kind: parsed.kind },
  });

  if (parsed.kind === 'campaign') {
    useMapStore.getState().setPendingCampaignId(parsed.id);
  }

  router.push(hrefForDeeplink(parsed) as Href);
}

function extractDeeplink(
  response: { notification: { request: { content: { data?: unknown } } } } | null,
): string | undefined {
  const data = response?.notification.request.content.data as
    { deeplink?: string; type?: string } | undefined;
  return typeof data?.deeplink === 'string' ? data.deeplink : undefined;
}

/** Обрабатывает тап по пушу в runtime и на cold start (§G10). */
export function usePushNotificationRouting(enabled: boolean) {
  const handledColdStart = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;

    void getPushNatives().then((push) => {
      if (cancelled || !push) {
        return;
      }

      subscription = push.Notifications.addNotificationResponseReceivedListener((response) => {
        openFromNotification(extractDeeplink(response));
      });

      if (cancelled) {
        subscription.remove();
        return;
      }

      if (!handledColdStart.current) {
        handledColdStart.current = true;
        void push.Notifications.getLastNotificationResponseAsync().then((response) => {
          if (!cancelled && response) {
            openFromNotification(extractDeeplink(response));
          }
        });
      }
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);
}
