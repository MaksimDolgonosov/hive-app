import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

type AuthFormCardProps = PropsWithChildren & {
  title: string;
  subtitle: string;
};

export function AuthFormCard({ title, subtitle, children }: AuthFormCardProps) {
  return (
    <View className="w-full gap-6">
      <View className="gap-3">
        <Text className="font-display text-[36px] font-bold leading-[40px] text-hive-foreground">
          {title}
        </Text>
        <Text className="font-inter text-[15px] leading-[22px] text-hive-muted">{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}
