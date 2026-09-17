import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/src/stores/authStore';
import { showInfoToast } from '@/src/stores/toastStore';
import { registerPushDevice } from '@/src/utils/push-device';

/** Регистрирует устройство после `setSession`, если разрешение уже выдано. */
export function usePushNotifications() {
  const { t } = useTranslation();
  const status = useAuthStore((state) => state.status);
  const attempted = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      attempted.current = false;
      return;
    }

    if (attempted.current) {
      return;
    }

    attempted.current = true;
    void registerPushDevice().then((result) => {
      if (result.status === 'dev-build-required' && Platform.OS === 'android') {
        showInfoToast({ message: t('push.devBuildRequired') });
      }
    });
  }, [status, t]);
}
