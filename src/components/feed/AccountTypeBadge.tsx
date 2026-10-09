import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { hasAccountTypeBadge, resolveAccountType } from '@/src/utils/account-type';

type AccountTypeBadgeProps = {
  accountType?: string | null;
};

export function AccountTypeBadge({ accountType }: AccountTypeBadgeProps) {
  const { t } = useTranslation();

  if (!hasAccountTypeBadge(accountType)) {
    return null;
  }

  const type = resolveAccountType(accountType);
  const label = type === 'official' ? t('accountType.official') : t('accountType.partner');

  return (
    <View className="rounded-full bg-hive-primary/20 px-1.5 py-0.5">
      <Text className="font-inter-bold text-[10px] uppercase tracking-[0.4px] text-hive-primary">
        {label}
      </Text>
    </View>
  );
}
