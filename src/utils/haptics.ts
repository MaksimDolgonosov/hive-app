import { isPublishBuzzEnabled } from '@/src/stores/preferencesStore';
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

const BUZZ_GAP_MS = 40;
/** iOS: пауза после паттерна, чтобы Taptic Engine успел отработать до unmount экрана. */
const IOS_POST_BUZZ_SETTLE_MS = 80;
const IOS_BUZZ_PULSES: Haptics.ImpactFeedbackStyle[] = [
  Haptics.ImpactFeedbackStyle.Heavy,
  Haptics.ImpactFeedbackStyle.Rigid,
  Haptics.ImpactFeedbackStyle.Heavy,
  Haptics.ImpactFeedbackStyle.Rigid,
  Haptics.ImpactFeedbackStyle.Heavy,
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function playBuzzImpacts(pulses: Haptics.ImpactFeedbackStyle[], gapMs: number) {
  for (let pulse = 0; pulse < pulses.length; pulse += 1) {
    await Haptics.impactAsync(pulses[pulse]);
    if (pulse < pulses.length - 1) {
      await delay(gapMs);
    }
  }
}

/** Короткий «точечный» отклик при постановке лайка. Вызывать синхронно в onPressIn. */
export function notifyLikeTap() {
  try {
    if (Platform.OS === 'android') {
      // Scalar vibrate(ms) на Android 8+ часто игнорируется — нужен паттерн [pause, duration].
      Vibration.vibrate([0, 40]);
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 40]);
    }
  }
}

/** Синхронный вызов в onPressIn — iOS игнорирует haptic после await в том же обработчике. */
export function triggerIosHapticHeavy() {
  if (Platform.OS !== 'ios') {
    return;
  }

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Dev: дополнительные паттерны после первого sync-импульса. */
export async function runIosHapticDevTest() {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    await delay(80);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    await delay(80);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    if (__DEV__) {
      console.warn('[runIosHapticDevTest]', error);
    }
  }
}

/** Вибрация после успешной публикации на карту. */
export async function notifyPublishSuccess() {
  if (!isPublishBuzzEnabled()) {
    return;
  }

  try {
    if (Platform.OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await delay(25);
      await playBuzzImpacts(IOS_BUZZ_PULSES, BUZZ_GAP_MS);
      await delay(IOS_POST_BUZZ_SETTLE_MS);
      return;
    }

    if (Platform.OS === 'android') {
      Vibration.vibrate([
        0,
        55,
        BUZZ_GAP_MS,
        55,
        BUZZ_GAP_MS,
        55,
        BUZZ_GAP_MS,
        55,
        BUZZ_GAP_MS,
        55,
      ]);
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playBuzzImpacts(
      [
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Medium,
      ],
      BUZZ_GAP_MS,
    );
  } catch {
    // optional
  }
}
