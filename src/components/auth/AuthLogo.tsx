import { Hexagon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

type AuthLogoProps = {
  subtitle: string;
};

export function AuthLogo({ subtitle }: AuthLogoProps) {
  return (
    <View className="mb-6 items-center gap-3">
      <View
        className="h-24 w-24 items-center justify-center overflow-hidden rounded-[28px]"
        style={{
          shadowColor: '#F5A623',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.33,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={['#F5A623', '#FF8C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 96,
            height: 96,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Hexagon color="#FFFFFF" size={48} strokeWidth={2} />
        </LinearGradient>
      </View>
      <Text className="font-inter text-[32px] font-bold text-hive-foreground">Hive</Text>
      <Text className="max-w-[280px] text-center font-inter text-[15px] text-hive-muted">
        {subtitle}
      </Text>
    </View>
  );
}
