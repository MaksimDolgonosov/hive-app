import { useTranslation } from 'react-i18next';

import { ConsentCheckbox } from '@/src/components/auth/ConsentCheckbox';

type PrivacyConsentCheckboxProps = {
  checked: boolean;
  invalid?: boolean;
  onCheckedChange: (checked: boolean) => void;
  onOpenPolicy: () => void;
};

export function PrivacyConsentCheckbox({
  checked,
  invalid,
  onCheckedChange,
  onOpenPolicy,
}: PrivacyConsentCheckboxProps) {
  const { t } = useTranslation();

  return (
    <ConsentCheckbox
      checked={checked}
      invalid={invalid}
      linkLabel={t('auth.privacyPolicyLink')}
      prefix={t('auth.privacyConsentPrefix')}
      onCheckedChange={onCheckedChange}
      onOpenDocument={onOpenPolicy}
    />
  );
}
