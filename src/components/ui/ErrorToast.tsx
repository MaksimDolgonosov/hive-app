import { AlertCircle, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { useToastStore } from '@/src/stores/toastStore';

const OFFLINE_BANNER_ESTIMATED_HEIGHT = 72;

export function ErrorToast() {
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();
  const visible = useToastStore((state) => state.visible);
  const title = useToastStore((state) => state.title);
  const message = useToastStore((state) => state.message);
  const type = useToastStore((state) => state.type);
  const hide = useToastStore((state) => state.hide);

  if (!visible) {
    return null;
  }

  const topOffset = insets.top + 12 + (isOffline ? OFFLINE_BANNER_ESTIMATED_HEIGHT : 0);
  const isError = type === 'error';

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-[60] px-4"
      style={{ top: topOffset }}
    >
      <View
        className={`flex-row items-start gap-3 rounded-hive-md border px-4 py-3 shadow-md ${
          isError
            ? 'border-red-200 bg-[#FFF5F5]'
            : 'border-[#F5A62333] bg-hive-surface'
        }`}
      >
        <AlertCircle color={isError ? '#DC2626' : '#F5A623'} size={20} strokeWidth={2.5} />

        <View className="min-w-0 flex-1">
          {title ? (
            <Text className="font-inter text-sm font-semibold text-hive-foreground">{title}</Text>
          ) : null}
          <Text
            className={`font-inter text-sm text-hive-muted ${title ? 'mt-0.5' : ''}`}
            numberOfLines={4}
          >
            {message}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-6 w-6 items-center justify-center"
          hitSlop={8}
          onPress={hide}
        >
          <X color="#8B7355" size={16} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}
