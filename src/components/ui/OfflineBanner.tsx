import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 z-50 bg-[#8B2500] px-4 py-2.5"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-center gap-2">
        <WifiOff color="#FFFFFF" size={16} strokeWidth={2.5} />
        <Text className="font-inter text-sm font-semibold text-white">{t('network.offline')}</Text>
      </View>
      <Text className="mt-0.5 text-center font-inter text-xs text-white/85">
        {t('network.offlineHint')}
      </Text>
    </View>
  );
}
