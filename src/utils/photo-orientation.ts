import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

type SavedImage = {
  uri: string;
  width: number;
  height: number;
};

async function saveAsJpeg(uri: string, rotateDegrees = 0): Promise<SavedImage> {
  const context = ImageManipulator.manipulate(uri);

  if (rotateDegrees !== 0) {
    context.rotate(rotateDegrees);
  } else {
    // На iOS заставляет пройти pipeline и «запечь» EXIF в пиксели.
    context.rotate(0);
  }

  const rendered = await context.renderAsync();
  return rendered.saveAsync({
    compress: 0.92,
    format: SaveFormat.JPEG,
  });
}

/** Физически выравнивает пиксели; после этого EXIF Orientation можно ставить в 1. */
export async function normalizePhotoPixels(uri: string): Promise<string> {
  let saved = await saveAsJpeg(uri);

  // Портретное приложение: если после bake всё ещё landscape — доворачиваем.
  if (saved.width > saved.height) {
    saved = await saveAsJpeg(saved.uri, 90);
  }

  return saved.uri;
}
