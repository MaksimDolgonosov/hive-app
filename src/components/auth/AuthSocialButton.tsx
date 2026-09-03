import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { HiveLoader } from '@/src/components/ui/HiveLoader';

type AuthSocialButtonProps = {
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
};

export function AuthSocialButton({
  accessibilityLabel,
  children,
  disabled = false,
  loading = false,
  onPress,
}: AuthSocialButtonProps) {
  const isPlaceholder = !onPress;
  const isDisabled = disabled || loading || isPlaceholder;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      className="h-[52px] w-[52px] items-center justify-center rounded-full border border-[#F5A62333] bg-hive-input-bg"
      disabled={isDisabled}
      style={{ opacity: isDisabled ? 0.45 : 1 }}
      onPress={onPress}
    >
      {loading ? <HiveLoader color="#2C1810" size="small" /> : children}
    </Pressable>
  );
}
