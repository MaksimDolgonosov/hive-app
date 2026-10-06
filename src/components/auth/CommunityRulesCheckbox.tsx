import { useTranslation } from 'react-i18next';

import { ConsentCheckbox } from '@/src/components/auth/ConsentCheckbox';

type CommunityRulesCheckboxProps = {
  checked: boolean;
  invalid?: boolean;
  onCheckedChange: (checked: boolean) => void;
  onOpenRules: () => void;
};

export function CommunityRulesCheckbox({
  checked,
  invalid,
  onCheckedChange,
  onOpenRules,
}: CommunityRulesCheckboxProps) {
  const { t } = useTranslation();

  return (
    <ConsentCheckbox
      checked={checked}
      invalid={invalid}
      linkLabel={t('auth.communityRulesLink')}
      prefix={t('auth.communityRulesPrefix')}
      onCheckedChange={onCheckedChange}
      onOpenDocument={onOpenRules}
    />
  );
}
