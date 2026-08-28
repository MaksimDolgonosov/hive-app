import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';

import { HiveLoader } from '@/src/components/ui/HiveLoader';

type AuthButtonProps = {
  title: string;
  onPress: () => void;
  onPressIn?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function AuthButton({
  title,
  onPress,
  onPressIn,
  loading = false,
  disabled = false,
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
      <LinearGradient
        colors={['#F5A623', '#FF8C00']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.gradient}
      >
        {loading ? <HiveLoader color="#FFFFFF" size="small" /> : (
          <Text style={styles.label}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    borderRadius: 14,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.27,
    shadowRadius: 12,
    elevation: 4,
  },
  pressableDisabled: {
    opacity: 0.7,
  },
  gradient: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
