import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center bg-hive-bg px-6">
      <Text className="font-inter text-2xl font-bold text-hive-foreground">
        {t('tabs.profile')}
      </Text>
      <Text className="mt-2 text-center font-inter text-sm text-hive-muted">
        {t('profile.comingSoon')}
      </Text>
    </View>
  );
}
