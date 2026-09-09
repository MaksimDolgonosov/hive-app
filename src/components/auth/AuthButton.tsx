import { ArrowRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { HiveTheme } from '@/src/theme/tokens';

type AuthButtonProps = {
  title: string;
  onPress: () => void;
  onPressIn?: () => void;
  loading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
};

export function AuthButton({
  title,
  onPress,
  onPressIn,
  loading = false,
  disabled = false,
  showArrow = true,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={onPressIn}
      style={[styles.pressable, isDisabled && styles.pressableDisabled]}
    >
      <View style={styles.inner}>
        {loading ? (
          <HiveLoader color={HiveTheme.textOnAccent} size="small" />
        ) : (
          <>
            <Text style={styles.label}>{title}</Text>
            {showArrow ? (
              <ArrowRight color={HiveTheme.textOnAccent} size={18} strokeWidth={2.5} />
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    borderRadius: HiveTheme.radiusPill,
    shadowColor: HiveTheme.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  pressableDisabled: {
    opacity: 0.7,
  },
  inner: {
    width: '100%',
    height: 56,
    borderRadius: HiveTheme.radiusPill,
    backgroundColor: HiveTheme.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontFamily: HiveTheme.fontBodyBold,
    fontSize: 16,
    fontWeight: '700',
    color: HiveTheme.textOnAccent,
    textAlign: 'center',
  },
});
