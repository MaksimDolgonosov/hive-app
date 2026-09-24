import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type ProfileCollectionLayoutProps = {
  title: string;
  onBack: () => void;
  children: ReactNode;
};

function screenBottomInset(reportedBottom: number): number {
  if (Platform.OS !== 'android') {
    return reportedBottom;
  }

  // На Android край экрана уходит под системную навигацию. Если inset не пришёл, берём высоту трёхкнопочной панели.
  const windowBottom = initialWindowMetrics?.insets.bottom ?? 0;
  return Math.max(reportedBottom, windowBottom, 48) + 8;
}

export function ProfileCollectionLayout({ title, onBack, children }: ProfileCollectionLayoutProps) {
  const insets = useSafeAreaInsets();
  const theme = useHiveTheme();
  const bottomInset = screenBottomInset(insets.bottom);

  return (
    <ScreenBackground>
      <View
        className="flex-row items-center border-b px-4 pb-3"
        style={{
          paddingTop: insets.top + 8,
          borderBottomColor: theme.stroke,
          backgroundColor: theme.glass,
        }}
      >
        <Pressable
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full border"
          style={{ borderColor: theme.stroke, backgroundColor: theme.surface }}
          onPress={onBack}
        >
          <ChevronLeft color={theme.text} size={24} />
        </Pressable>
        <Text className="flex-1 text-center font-display text-lg font-bold text-hive-foreground">
          {title}
        </Text>
        <View className="w-10" />
      </View>

      <View style={{ flex: 1, paddingBottom: bottomInset }}>{children}</View>
    </ScreenBackground>
  );
}
