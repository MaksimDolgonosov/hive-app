import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { LoadingScreen } from '@/src/components/ui/LoadingScreen';

export default function SplashPreviewScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <LoadingScreen />
      <Pressable
        accessibilityHint={t('profile.splashPreviewCloseHint')}
        accessibilityLabel={t('profile.splashPreviewClose')}
        accessibilityRole="button"
        style={StyleSheet.absoluteFill}
        onPress={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
