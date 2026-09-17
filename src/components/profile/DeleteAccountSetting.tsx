import { UserX } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { ProfileMenuRow } from '@/src/components/profile/ProfileMenuRow';
import { useAuthStore } from '@/src/stores/authStore';
import { showApiErrorToast } from '@/src/utils/show-toast';

export function DeleteAccountSetting() {
  const { t } = useTranslation();
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAccount();
    } catch (error) {
      showApiErrorToast(error, {
        titleKey: 'profile.deleteAccountFailedTitle',
        fallbackKey: 'profile.deleteAccountFailedMessage',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function confirmDeleteAccount() {
    if (isDeleting) {
      return;
    }

    Alert.alert(t('profile.deleteAccountConfirmTitle'), t('profile.deleteAccountConfirmMessage'), [
      { text: t('profile.deleteAccountCancel'), style: 'cancel' },
      {
        text: t('profile.deleteAccountConfirm'),
        style: 'destructive',
        onPress: () => void handleDeleteAccount(),
      },
    ]);
  }

  return (
    <ProfileMenuRow
      disabled={isDeleting}
      icon={UserX}
      label={t('profile.menuDeleteAccount')}
      showDivider={false}
      tone="danger"
      onPress={confirmDeleteAccount}
    />
  );
}
