import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type AuthBackButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};

export function AuthBackButton({ onPress, accessibilityLabel }: AuthBackButtonProps) {
  const theme = useHiveTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="mb-4 h-10 w-10 items-center justify-center rounded-full border border-hive-stroke bg-hive-surface"
      hitSlop={8}
      onPress={onPress}
    >
      <ChevronLeft color={theme.text} size={24} />
    </Pressable>
  );
}
