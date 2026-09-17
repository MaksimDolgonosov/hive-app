import { BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';

type OnboardingPreviewLinkProps = {
  onPress: () => void;
};

export function OnboardingPreviewLink({ onPress }: OnboardingPreviewLinkProps) {
  const { t } = useTranslation();

  return (
    <ProfileMenuRow icon={BookOpen} label={t('profile.onboardingPreviewLabel')} onPress={onPress} />
  );
}
