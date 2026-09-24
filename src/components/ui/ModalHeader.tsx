import { router, type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type ModalHeaderProps = {
  title: string;
  backLabel: string;
};

export function ModalHeader({ title, backLabel }: ModalHeaderProps) {
  const theme = useHiveTheme();
  const insets = useSafeAreaInsets();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/profile' as Href);
  }

  return (
    <View
      className="flex-row items-center gap-3 border-b px-4 pb-3"
      style={{ paddingTop: insets.top + 8, borderBottomColor: theme.stroke }}
    >
      <Pressable
        accessibilityLabel={backLabel}
        accessibilityRole="button"
        className="h-10 w-10 items-center justify-center"
        onPress={handleBack}
      >
        <ChevronLeft color={theme.text} size={24} />
      </Pressable>
      <Text className="flex-1 font-display text-xl font-bold text-hive-foreground" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}
