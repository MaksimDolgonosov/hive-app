import { useTranslation } from 'react-i18next';

import { ConsentCheckbox } from '@/src/components/auth/ConsentCheckbox';

type CommunityRulesCheckboxProps = {
  checked: boolean;
  error?: string;
  onCheckedChange: (checked: boolean) => void;
  onOpenRules: () => void;
};

export function CommunityRulesCheckbox({
  checked,
  error,
  onCheckedChange,
  onOpenRules,
}: CommunityRulesCheckboxProps) {
  const { t } = useTranslation();

  return (
    <ConsentCheckbox
      checked={checked}
      error={error}
      linkLabel={t('auth.communityRulesLink')}
      prefix={t('auth.communityRulesPrefix')}
      onCheckedChange={onCheckedChange}
      onOpenDocument={onOpenRules}
    />
  );
}
