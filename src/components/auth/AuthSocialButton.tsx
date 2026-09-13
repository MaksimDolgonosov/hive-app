import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type AuthSocialButtonProps = {
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  variant?: 'icon' | 'row';
  label?: string;
};

export function AuthSocialButton({
  accessibilityLabel,
  children,
  disabled = false,
  loading = false,
  onPress,
  variant = 'icon',
  label,
}: AuthSocialButtonProps) {
  const isPlaceholder = !onPress;
  const isDisabled = disabled || loading || isPlaceholder;
  const isRow = variant === 'row';
  const theme = useHiveTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      className={
        isRow
          ? 'h-14 w-full flex-row items-center justify-center gap-3 rounded-full border border-hive-primary bg-hive-surface'
          : 'h-14 w-14 items-center justify-center rounded-full border border-hive-primary bg-hive-surface'
      }
      disabled={isDisabled}
      style={{ opacity: isDisabled ? 0.45 : 1 }}
      onPress={onPress}
    >
      {loading ? (
        <HiveLoader color={theme.text} size="small" />
      ) : (
        <>
          {children}
          {isRow && label ? (
            <Text className="font-inter text-[15px] font-semibold text-hive-foreground">
              {label}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}
