import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { Map } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { yandexMapsTermsUrl } from '@/legal/yandex-maps-terms';

export function YandexMapsTermsLink() {
  const { t, i18n } = useTranslation();

  return (
    <ProfileMenuRow
      icon={Map}
      label={t('profile.yandexMapsTermsTitle')}
      onPress={() => {
        void openBrowserAsync(yandexMapsTermsUrl(i18n.language), {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      }}
    />
  );
}
