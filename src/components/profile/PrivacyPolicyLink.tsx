import { ChevronRight, Shield } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type PrivacyPolicyLinkProps = {
  className?: string;
  onPress: () => void;
};

export function PrivacyPolicyLink({ className, onPress }: PrivacyPolicyLinkProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();

  return (
    <View className={className}>
      <Text className="mb-2 font-inter text-[13px] font-semibold text-hive-foreground">
        {t('profile.privacyPolicyLabel')}
      </Text>

      <Pressable
        accessibilityRole="link"
        className="min-h-14 flex-row items-center gap-3 rounded-hive-md border border-hive-stroke bg-hive-input-bg px-3.5 py-3"
        onPress={onPress}
      >
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-hive-primary/15">
          <Shield color={theme.accent} size={16} strokeWidth={2} />
        </View>

        <View className="flex-1">
          <Text className="font-inter text-[15px] font-medium text-hive-foreground">
            {t('profile.privacyPolicyTitle')}
          </Text>
          <Text className="mt-0.5 font-inter text-xs text-hive-muted">
            {t('profile.privacyPolicyHint')}
          </Text>
        </View>

        <ChevronRight color={theme.textDim} size={16} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
