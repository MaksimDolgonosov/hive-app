import { useEffect, useRef } from 'react';

import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { flushAnalyticsQueue, trackEvent } from '@/src/utils/analytics-queue';

let appOpenTracked = false;

/** Ставит очередь аналитики на отправку и шлёт `app_open` один раз за процесс (§G12). */
export function useAnalytics() {
  const { isOffline } = useNetworkStatus();
  const wasOffline = useRef(isOffline);

  useEffect(() => {
    if (appOpenTracked) {
      return;
    }

    appOpenTracked = true;
    trackEvent('app_open');
  }, []);

  useEffect(() => {
    if (wasOffline.current && !isOffline) {
      void flushAnalyticsQueue();
    }

    wasOffline.current = isOffline;
  }, [isOffline]);
}
