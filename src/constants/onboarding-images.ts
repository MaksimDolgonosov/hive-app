import type { ImageSource } from 'expo-image';

export const ONBOARDING_IMAGES = {
  welcome: require('../../assets/images/onboarding/welcome.jpg') as ImageSource,
  camera: require('../../assets/images/onboarding/camera.jpg') as ImageSource,
  lifetime: require('../../assets/images/onboarding/lifetime.jpg') as ImageSource,
  hive: require('../../assets/images/onboarding/hive.jpg') as ImageSource,
} as const;
