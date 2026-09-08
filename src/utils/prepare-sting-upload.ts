import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Ограничение по короткой стороне, а не по ширине: вертикальные и горизонтальные кадры
 * дают одинаковое число пикселей. Согласовано с backend thumbnail pipeline — меньше RAM
 * на Railway и быстрее upload.
 */
const MAX_UPLOAD_SHORT_SIDE = 1920;
const UPLOAD_JPEG_QUALITY = 0.82;

export type PhotoDimensions = {
  width: number;
  height: number;
};

/**
 * Единственный проход через манипулятор: ресайз и компрессия до итогового файла.
 * Он же запекает EXIF Orientation в пиксели (на iOS без прохода флаг остаётся только
 * в метаданных), поэтому после него Orientation можно выставить в 1. Ориентацию кадра
 * проход сохраняет — горизонтальные снимки остаются горизонтальными.
 *
 * Вызывается строго до embedCaptureMetadataInPhoto: манипулятор переэнкодит JPEG
 * и не переносит пользовательские EXIF-теги, поэтому GPS и время вшиваются последними.
 */
export async function prepareStingPhotoForUpload(
  uri: string,
  source: PhotoDimensions,
): Promise<string> {
  const isLandscape = source.width > source.height;
  const shortSide = isLandscape ? source.height : source.width;

  const context = ImageManipulator.manipulate(uri);

  if (shortSide > MAX_UPLOAD_SHORT_SIDE) {
    context.resize(
      isLandscape
        ? { width: null, height: MAX_UPLOAD_SHORT_SIDE }
        : { width: MAX_UPLOAD_SHORT_SIDE, height: null },
    );
  } else {
    // Апскейл не нужен, но проход обязателен — на нём запекается Orientation.
    context.rotate(0);
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: UPLOAD_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  return saved.uri;
}
