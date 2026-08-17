import type { LucideIcon } from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { AuthScreenLayout } from '@/src/components/auth/AuthScreenLayout';
import { LanguageSelect } from '@/src/components/ui/LanguageSelect';

export const ONBOARDING_TOTAL_STEPS = 6;

type OnboardingScreenProps = PropsWithChildren<{
  icon: LucideIcon;
  title: string;
  description: string;
  step: number;
  totalSteps?: number;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
  showLanguagePicker?: boolean;
}>;

export function OnboardingScreen({
  icon: Icon,
  title,
  description,
  step,
  totalSteps = ONBOARDING_TOTAL_STEPS,
  actionLabel,
  onAction,
  loading = false,
  showLanguagePicker = false,
  children,
}: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const layoutHeight = windowHeight - insets.top - insets.bottom - 40;

  return (
    <AuthScreenLayout>
      <View style={{ height: layoutHeight }}>
        <View className="flex-1 items-center justify-center px-2">
          <View
            className="h-24 w-24 items-center justify-center rounded-full bg-hive-primary/15"
            style={{
              shadowColor: '#F5A623',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
            }}
          >
            <Icon color="#F5A623" size={40} strokeWidth={2} />
          </View>

          <Text className="mt-8 text-center font-inter text-[28px] font-bold leading-8 text-hive-foreground">
            {title}
          </Text>
          <Text className="mt-3 max-w-[320px] text-center font-inter text-[15px] leading-[22px] text-hive-muted">
            {description}
          </Text>

          {showLanguagePicker && <LanguageSelect className="mt-6 w-full max-w-[320px]" />}

          {children}
        </View>

        <View className="gap-4" style={{ paddingBottom: insets.bottom + 8 }}>
          <View className="flex-row items-center justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, index) => {
              const isActive = index + 1 === step;

              return (
                <View
                  key={index}
                  className={`h-2 rounded-full ${isActive ? 'w-6 bg-hive-primary' : 'w-2 bg-hive-primary/25'}`}
                />
              );
            })}
          </View>

          <AuthButton loading={loading} title={actionLabel} onPress={onAction} />
        </View>
      </View>
    </AuthScreenLayout>
  );
}
