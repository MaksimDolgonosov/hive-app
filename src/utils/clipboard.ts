import { requireOptionalNativeModule } from 'expo';

/** Копирует текст, если native-модуль есть. Иначе `false` — без падения приложения. */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!requireOptionalNativeModule('ExpoClipboard')) {
    return false;
  }

  try {
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
