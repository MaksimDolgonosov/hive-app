import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Согласовано с backend thumbnail pipeline — меньше RAM на Railway и быстрее upload. */
const MAX_UPLOAD_WIDTH = 1920;
const UPLOAD_JPEG_QUALITY = 0.82;

export async function prepareStingPhotoForUpload(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MAX_UPLOAD_WIDTH });

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: UPLOAD_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  return saved.uri;
}
