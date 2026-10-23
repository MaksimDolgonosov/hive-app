import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Нативный Liquid Glass на iOS 26+, включая debug и симулятор.
 * В Expo Go системного UIGlassEffect нет.
 */
export function shouldUseLiquidGlass(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }

  if (Constants.appOwnership === 'expo') {
    return false;
  }

  const major = Number.parseInt(String(Platform.Version), 10);
  return Number.isFinite(major) && major >= 26;
}
