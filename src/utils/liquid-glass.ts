import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Liquid Glass только в production native-сборке (не Expo Go, не __DEV__). */
export function shouldUseLiquidGlass(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }

  if (__DEV__) {
    return false;
  }

  if (Constants.appOwnership === 'expo') {
    return false;
  }

  return true;
}
