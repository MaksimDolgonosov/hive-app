import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';

type SplashPreviewLinkProps = {
  onPress: () => void;
};

export function SplashPreviewLink({ onPress }: SplashPreviewLinkProps) {
  const { t } = useTranslation();

  return (
    <ProfileMenuRow icon={Sparkles} label={t('profile.splashPreviewLabel')} onPress={onPress} />
  );
}
