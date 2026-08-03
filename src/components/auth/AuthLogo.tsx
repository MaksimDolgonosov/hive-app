import { Hexagon } from 'lucide-react-native';
import { Text, View } from 'react-native';

type AuthLogoProps = {
  subtitle: string;
};

export function AuthLogo({ subtitle }: AuthLogoProps) {
  return (
    <View className="mb-6 items-center gap-3">
      <View
        className="h-[88px] w-[88px] items-center justify-center rounded-full bg-hive-primary"
        style={{
          shadowColor: '#F5A623',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.33,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <Hexagon color="#FFFFFF" size={44} strokeWidth={2} />
      </View>
      <Text className="font-inter text-[32px] font-bold text-hive-foreground">Hive</Text>
      <Text className="max-w-[280px] text-center font-inter text-[15px] text-hive-muted">
        {subtitle}
      </Text>
    </View>
  );
}
