import { BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';

type CommunityGuidelinesLinkProps = {
  onPress: () => void;
};

export function CommunityGuidelinesLink({ onPress }: CommunityGuidelinesLinkProps) {
  const { t } = useTranslation();

  return (
    <ProfileMenuRow
      icon={BookOpen}
      label={t('profile.communityGuidelinesTitle')}
      onPress={onPress}
    />
  );
}
