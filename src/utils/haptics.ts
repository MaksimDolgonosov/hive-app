import * as Haptics from 'expo-haptics';
import { InteractionManager, Platform, Vibration } from 'react-native';

import { playIosShutterBuzz, playIosShutterClick } from '@/src/utils/ios-feedback-sound';

const BUZZ_GAP_MS = 40;
/** iOS: пауза после паттерна, чтобы Taptic Engine успел отработать до unmount экрана. */
const IOS_POST_BUZZ_SETTLE_MS = 80;
/**
 * iOS: после unmount CameraView AVFoundation ещё кратко держит сессию —
 * Taptic Engine молча no-op, пока «камера активна» (см. expo-haptics docs).
 */
const IOS_CAMERA_RELEASE_DELAY_MS = 100;
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

async function waitForIosHapticsReady() {
  if (Platform.OS !== 'ios') {
    return;
  }

  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
  await delay(IOS_CAMERA_RELEASE_DELAY_MS);
}

async function playBuzzImpacts(pulses: Haptics.ImpactFeedbackStyle[], gapMs: number) {
  for (let pulse = 0; pulse < pulses.length; pulse += 1) {
    await Haptics.impactAsync(pulses[pulse]);
    if (pulse < pulses.length - 1) {
      await delay(gapMs);
    }
  }
}

/**
 * Feedback в момент нажатия затвора.
 * iOS: короткий звук (Taptic блокируется активной камерой / AVAudioSession).
 * Android: вибрация через expo-haptics.
 */
export async function impactCapture() {
  try {
    if (Platform.OS === 'ios') {
      await playIosShutterClick();
      // Пробуем Taptic — на части устройств/версий iOS может сработать.
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // optional
  }
}

/**
 * iOS: дополнительный Taptic на preview, когда CameraView уже размонтирован.
 * Звук затвора уже проигран на press — здесь только попытка вибрации.
 */
export async function notifyCaptureShutter() {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    await waitForIosHapticsReady();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // optional
  }
}

/** «Жужжание пчелы» после успешной публикации. */
export async function notifyPublishSuccess() {
  try {
    if (Platform.OS === 'ios') {
      await waitForIosHapticsReady();
      await playIosShutterBuzz(IOS_BUZZ_PULSES.length, BUZZ_GAP_MS);
    }

    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await delay(25);
      await playBuzzImpacts(IOS_BUZZ_PULSES, BUZZ_GAP_MS);
      await delay(IOS_POST_BUZZ_SETTLE_MS);
      return;
    }

    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 55, BUZZ_GAP_MS, 55, BUZZ_GAP_MS, 55]);
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playBuzzImpacts(
      [
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

export async function notifyPublishError() {
  try {
    if (Platform.OS === 'ios') {
      await waitForIosHapticsReady();
      await playIosShutterClick();
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // optional
  }
}
