declare module 'piexifjs' {
  export interface IExif {
    '0th': Record<number, unknown>;
    Exif: Record<number, unknown>;
    GPS: Record<number, unknown>;
    Interop: Record<number, unknown>;
    '1st': Record<number, unknown>;
    thumbnail: string | null;
  }

  export const GPSIFD: Record<string, number>;
  export const ImageIFD: Record<string, number>;
  export const ExifIFD: Record<string, number>;
  export const GPSHelper: {
    degToDmsRational: (deg: number) => [[number, number], [number, number], [number, number]];
    dmsRationalToDeg: (
      dmsArray: [[number, number], [number, number], [number, number]],
      ref: string,
    ) => number;
  };

  export function load(jpegData: string): IExif;
  export function dump(exifObj: IExif): string;
  export function insert(exifBytes: string, jpegData: string): string;
}
