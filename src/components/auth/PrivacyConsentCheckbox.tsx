import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type PrivacyConsentCheckboxProps = {
  checked: boolean;
  error?: string;
  onCheckedChange: (checked: boolean) => void;
  onOpenPolicy: () => void;
};

export function PrivacyConsentCheckbox({
  checked,
  error,
  onCheckedChange,
  onOpenPolicy,
}: PrivacyConsentCheckboxProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();

  return (
    <View className="gap-2">
      <View className="flex-row items-start gap-3">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          className={`mt-0.5 h-6 w-6 items-center justify-center rounded-md border ${
            checked ? 'border-hive-primary bg-hive-primary' : 'border-hive-stroke bg-hive-surface'
          }`}
          hitSlop={8}
          onPress={() => onCheckedChange(!checked)}
        >
          {checked ? <Check color={theme.textOnAccent} size={16} strokeWidth={3} /> : null}
        </Pressable>

        <Text className="flex-1 font-inter text-[14px] leading-[20px] text-hive-muted">
          <Text
            className="font-inter text-[14px] leading-[20px] text-hive-muted"
            onPress={() => onCheckedChange(!checked)}
          >
            {t('auth.privacyConsentPrefix')}{' '}
          </Text>
          <Text
            accessibilityRole="link"
            className="font-inter text-[14px] font-semibold text-hive-primary"
            onPress={onOpenPolicy}
          >
            {t('auth.privacyPolicyLink')}
          </Text>
        </Text>
      </View>

      {error ? <Text className="font-inter text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
