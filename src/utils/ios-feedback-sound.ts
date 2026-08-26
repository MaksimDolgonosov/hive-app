import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

const SHUTTER_SOURCE = require('../../assets/sounds/shutter.wav');

let shutterPlayer: AudioPlayer | null = null;
let audioModeConfigured = false;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function ensureIosShutterAudioReady() {
  if (Platform.OS !== 'ios' || audioModeConfigured) {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
  });

  if (!shutterPlayer) {
    shutterPlayer = createAudioPlayer(SHUTTER_SOURCE);
  }

  audioModeConfigured = true;
}

/** Короткий «щелчок» — работает на iOS даже когда Taptic Engine заблокирован камерой. */
export async function playIosShutterClick() {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    await ensureIosShutterAudioReady();
    shutterPlayer?.seekTo(0);
    shutterPlayer?.play();
  } catch {
    // optional
  }
}

/** Серия щелчков вместо haptic-паттерна на iOS. */
export async function playIosShutterBuzz(clicks: number, gapMs: number) {
  if (Platform.OS !== 'ios') {
    return;
  }

  for (let click = 0; click < clicks; click += 1) {
    await playIosShutterClick();
    if (click < clicks - 1) {
      await delay(gapMs);
    }
  }
}

/** Dev: проверка, что expo-haptics живой вне камеры. */
export async function debugIosHapticTest() {
  const Haptics = await import('expo-haptics');
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}
