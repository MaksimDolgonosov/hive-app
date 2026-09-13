import { Hexagon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { HiveTheme } from '@/src/theme/tokens';

type AuthLogoProps = {
  subtitle?: string;
};

export function AuthLogo({ subtitle }: AuthLogoProps) {
  return (
    <View className="mb-2 gap-3">
      <View className="flex-row items-center gap-2.5">
        <View
          className="h-8 w-8 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: HiveTheme.accent }}
        >
          <Hexagon
            color={HiveTheme.textOnAccent}
            fill={HiveTheme.textOnAccent}
            size={18}
            strokeWidth={0}
          />
        </View>
        <Text className="font-display text-[19px] font-bold uppercase tracking-[1.6px] text-hive-foreground">
          HIVE
        </Text>
      </View>
      {subtitle ? (
        <Text className="font-inter text-[15px] leading-[22px] text-hive-muted">{subtitle}</Text>
      ) : null}
    </View>
  );
}
