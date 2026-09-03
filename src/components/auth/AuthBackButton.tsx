import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

type AuthBackButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};

export function AuthBackButton({ onPress, accessibilityLabel }: AuthBackButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-hive-surface/95"
      hitSlop={8}
      onPress={onPress}
    >
      <ChevronLeft color="#2C1810" size={24} />
    </Pressable>
  );
}
