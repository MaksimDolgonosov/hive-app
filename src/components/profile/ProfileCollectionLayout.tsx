import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProfileCollectionLayoutProps = {
  title: string;
  onBack: () => void;
  children: ReactNode;
};

export function ProfileCollectionLayout({ title, onBack, children }: ProfileCollectionLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={['#FFF8ED', '#FFE8B8', '#FFD54F44']} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
      <View
        className="flex-row items-center border-b border-hive-primary/10 px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-hive-surface/95"
          onPress={onBack}
        >
          <ChevronLeft color="#2C1810" size={24} />
        </Pressable>
        <Text className="flex-1 text-center font-inter text-lg font-semibold text-hive-foreground">
          {title}
        </Text>
        <View className="w-10" />
      </View>

      {children}
    </LinearGradient>
  );
}
