import i18n from '@/src/i18n';
import { showErrorToast } from '@/src/stores/toastStore';
import { getApiErrorMessage } from '@/src/utils/api-error';

type ShowApiErrorToastOptions = {
  titleKey?: string;
  fallbackKey?: string;
};

export function showApiErrorToast(
  error: unknown,
  options: ShowApiErrorToastOptions = {},
): void {
  const { titleKey, fallbackKey = 'errors.generic' } = options;

  showErrorToast({
    title: titleKey ? i18n.t(titleKey) : undefined,
    message: getApiErrorMessage(error, fallbackKey),
  });
}

export function showMessageToast(messageKey: string, titleKey?: string): void {
  showErrorToast({
    title: titleKey ? i18n.t(titleKey) : undefined,
    message: i18n.t(messageKey),
  });
}
