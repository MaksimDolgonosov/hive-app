import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/src/components/ui/ScreenBackground';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type ProfileCollectionLayoutProps = {
  title: string;
  onBack: () => void;
  children: ReactNode;
};

export function ProfileCollectionLayout({ title, onBack, children }: ProfileCollectionLayoutProps) {
  const insets = useSafeAreaInsets();
  const theme = useHiveTheme();

  return (
    <ScreenBackground>
      <View
        className="flex-row items-center border-b border-hive-stroke px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full border border-hive-stroke bg-hive-surface"
          onPress={onBack}
        >
          <ChevronLeft color={theme.text} size={24} />
        </Pressable>
        <Text className="flex-1 text-center font-display text-lg font-bold text-hive-foreground">
          {title}
        </Text>
        <View className="w-10" />
      </View>

      {children}
    </ScreenBackground>
  );
}
