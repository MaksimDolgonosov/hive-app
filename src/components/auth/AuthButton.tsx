import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type AuthButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function AuthButton({ title, onPress, loading = false, disabled = false }: AuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={isDisabled ? 'opacity-70' : 'opacity-100'}
    >
      <LinearGradient
        colors={['#F5A623', '#FF8C00']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        className="h-[52px] items-center justify-center rounded-hive-md"
        style={{
          shadowColor: '#F5A623',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.27,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="font-inter text-base font-bold text-white">{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}
