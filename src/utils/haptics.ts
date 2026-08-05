import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

const BUZZ_GAP_MS = 40;
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

export async function impactCapture() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Короткое «жужжание пчелы» после успешной публикации. */
export async function notifyPublishSuccess() {
  try {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await delay(25);
      await playBuzzImpacts(IOS_BUZZ_PULSES, BUZZ_GAP_MS);
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
    // Haptics optional — не блокируем UX при ошибке
  }
}

export async function notifyPublishError() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
