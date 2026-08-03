import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

type AuthFormCardProps = PropsWithChildren & {
  title: string;
  subtitle: string;
};

export function AuthFormCard({ title, subtitle, children }: AuthFormCardProps) {
  return (
    <View
      className="w-full gap-6 rounded-hive border border-[#FFFFFF80] bg-hive-surface p-6"
      style={{
        shadowColor: '#F5A623',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.13,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <View className="gap-1">
        <Text className="font-inter text-[22px] font-bold text-hive-foreground">{title}</Text>
        <Text className="font-inter text-sm text-hive-muted">{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}
