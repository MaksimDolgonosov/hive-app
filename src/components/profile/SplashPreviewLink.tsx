import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';

const LIGHT_ICON = require('../../../assets/images/splash-icon.png');
const DARK_ICON = require('../../../assets/Hive.icon/Assets/icon.png');

type SplashPreviewLinkProps = {
  className?: string;
  onPress: () => void;
};

export function SplashPreviewLink({ className, onPress }: SplashPreviewLinkProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className={className}>
      <Text className="mb-2 font-inter text-[13px] font-semibold text-hive-foreground">
        {t('profile.splashPreviewLabel')}
      </Text>

      <Pressable
        accessibilityRole="link"
        className="min-h-14 flex-row items-center gap-3 rounded-hive-md border border-hive-stroke bg-hive-input-bg px-3.5 py-3"
        onPress={onPress}
      >
        <Image
          contentFit="cover"
          source={isDark ? DARK_ICON : LIGHT_ICON}
          style={{ width: 32, height: 32, borderRadius: 8 }}
        />

        <View className="flex-1">
          <Text className="font-inter text-[15px] font-medium text-hive-foreground">
            {t('profile.splashPreviewTitle')}
          </Text>
          <Text className="mt-0.5 font-inter text-xs text-hive-muted">
            {t('profile.splashPreviewHint', { theme: t(`theme.${colorScheme}`) })}
          </Text>
        </View>

        <ChevronRight color={theme.textDim} size={16} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
