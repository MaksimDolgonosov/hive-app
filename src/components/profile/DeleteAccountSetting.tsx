import { UserX } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { showApiErrorToast } from '@/src/utils/show-toast';

type DeleteAccountSettingProps = {
  className?: string;
};

export function DeleteAccountSetting({ className }: DeleteAccountSettingProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
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
    <View className={className}>
      <Text className="mb-2 font-inter text-[13px] font-semibold text-hive-foreground">
        {t('profile.deleteAccountLabel')}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
        className="min-h-14 flex-row items-center gap-3 rounded-hive-md border border-hive-stroke bg-hive-input-bg px-3.5 py-3"
        disabled={isDeleting}
        onPress={confirmDeleteAccount}
        style={{ opacity: isDeleting ? 0.6 : 1 }}
      >
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-hive-danger/15">
          <UserX color={theme.danger} size={16} strokeWidth={2} />
        </View>

        <View className="flex-1">
          <Text className="font-inter text-[15px] font-medium text-hive-danger">
            {t('profile.menuDeleteAccount')}
          </Text>
          <Text className="mt-0.5 font-inter text-xs text-hive-muted">
            {t('profile.deleteAccountHint')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
