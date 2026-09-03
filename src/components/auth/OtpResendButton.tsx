import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';

type OtpResendButtonProps = {
  remainingSec: number;
  loading?: boolean;
  emphasize?: boolean;
  onPress: () => void;
};

export function OtpResendButton({
  remainingSec,
  loading = false,
  emphasize = false,
  onPress,
}: OtpResendButtonProps) {
  const { t } = useTranslation();
  const isCoolingDown = remainingSec > 0;
  const isDisabled = isCoolingDown || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      className="items-center py-1"
      disabled={isDisabled}
      onPress={onPress}
    >
      <Text
        className={`text-center font-inter text-sm ${
          isDisabled
            ? 'text-hive-muted'
            : emphasize
              ? 'font-bold text-hive-primary'
              : 'font-semibold text-hive-primary'
        }`}
      >
        {isCoolingDown
          ? t('auth.resendAvailableIn', { seconds: remainingSec })
          : t('auth.resendCode')}
      </Text>
    </Pressable>
  );
}
