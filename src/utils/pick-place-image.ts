import * as ImagePicker from 'expo-image-picker';

import { prepareStingPhotoForUpload } from '@/src/utils/prepare-sting-upload';

export type PlaceImageSource = 'camera' | 'library';

export class PlaceLibraryPermissionError extends Error {
  constructor() {
    super('Place library permission denied');
    this.name = 'PlaceLibraryPermissionError';
  }
}

async function prepareAsset(asset: ImagePicker.ImagePickerAsset): Promise<string | null> {
  if (!asset.uri) {
    return null;
  }
  const width = asset.width || 1600;
  const height = asset.height || 1600;
  return prepareStingPhotoForUpload(asset.uri, { width, height });
}

export async function pickPlaceImages(options: {
  source: PlaceImageSource;
  selectionLimit?: number;
}): Promise<string[]> {
  if (options.source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new PlaceLibraryPermissionError();
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      presentationStyle: ImagePicker.UIImagePickerPresentationStyle.OVER_FULL_SCREEN,
    });
    if (result.canceled || !result.assets[0]) {
      return [];
    }
    const uri = await prepareAsset(result.assets[0]);
    return uri ? [uri] : [];
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new PlaceLibraryPermissionError();
  }

  const selectionLimit = Math.max(options.selectionLimit ?? 1, 1);
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    allowsMultipleSelection: selectionLimit > 1,
    selectionLimit,
    presentationStyle: ImagePicker.UIImagePickerPresentationStyle.OVER_FULL_SCREEN,
  });
  if (result.canceled) {
    return [];
  }

  const prepared = await Promise.all(result.assets.slice(0, selectionLimit).map((asset) => prepareAsset(asset)));
  return prepared.filter((uri): uri is string => Boolean(uri));
}
