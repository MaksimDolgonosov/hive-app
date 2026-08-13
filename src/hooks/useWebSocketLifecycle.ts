import { useEffect } from 'react';

import { websocket } from '@/src/api/websocket';
import { useAuthStore } from '@/src/stores/authStore';

export function useWebSocketLifecycle(): void {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) {
      websocket.disconnect();
      return;
    }

    websocket.connect(accessToken);

    return () => {
      websocket.disconnect();
    };
  }, [accessToken, status]);
}
