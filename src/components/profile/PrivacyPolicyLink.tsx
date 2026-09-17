import { Shield } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';

type PrivacyPolicyLinkProps = {
  onPress: () => void;
};

export function PrivacyPolicyLink({ onPress }: PrivacyPolicyLinkProps) {
  const { t } = useTranslation();

  return <ProfileMenuRow icon={Shield} label={t('profile.privacyPolicyTitle')} onPress={onPress} />;
}
