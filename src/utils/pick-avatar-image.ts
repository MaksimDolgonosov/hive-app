import * as ImagePicker from 'expo-image-picker';

export type AvatarPickSource = 'camera' | 'library';

export class AvatarPermissionError extends Error {
  constructor(public readonly source: AvatarPickSource) {
    super('Avatar permission denied');
    this.name = 'AvatarPermissionError';
  }
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.9,
};

export async function pickAvatarImage(source: AvatarPickSource): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new AvatarPermissionError('camera');
    }

    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    return result.canceled ? null : (result.assets[0]?.uri ?? null);
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new AvatarPermissionError('library');
  }

  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}
