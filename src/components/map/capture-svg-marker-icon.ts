import { PixelRatio } from 'react-native';

type SvgCaptureTarget = {
  toDataURL: (
    callback: (base64: string) => void,
    options?: { width: number; height: number },
  ) => void;
};

/** MapKit берёт PNG как есть, со scale = 1. Множитель возвращает иконку к размеру в поинтах. */
export function markerIconScale(): number {
  return 1 / PixelRatio.get();
}

/**
 * Снимок SVG после того, как картинка уже в дереве.
 * MapKit не дожидается сетевого SvgImage внутри view маркера.
 */
export function captureSvgMarkerIcon(svg: SvgCaptureTarget, size: number): Promise<string | null> {
  const pixelSize = Math.max(1, Math.round(size * PixelRatio.get()));

  return new Promise((resolve) => {
    svg.toDataURL(
      (base64) => {
        const cleaned = base64?.replace(/\s+/g, '') ?? '';
        resolve(cleaned ? `data:image/png;base64,${cleaned}` : null);
      },
      { width: pixelSize, height: pixelSize },
    );
  });
}
