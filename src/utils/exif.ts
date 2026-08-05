import { File, Paths } from 'expo-file-system';
import piexif from 'piexifjs';

type ExifRecord = Record<string, unknown>;

export type CaptureMetadata = {
  lat: number;
  lng: number;
  altitude: number | null;
  capturedAt: Date;
};

export type PhotoFileMetadata = {
  lat: number;
  lng: number;
  capturedAt: string;
};

type DmsRational = [[number, number], [number, number], [number, number]];

const EXIF_DATE_TIME_PATTERN = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
const COORD_DECIMALS = 6;

function getExifOffset(exif: ExifRecord): string {
  const offset = exif.OffsetTimeOriginal ?? exif.OffsetTimeDigitized ?? exif.OffsetTime;

  if (typeof offset === 'string' && offset.length > 0) {
    return offset;
  }

  return 'Z';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Максимум из env бэкенда (STING_MAX_GPS_ACCURACY_M). */
export const MAX_GPS_ACCURACY_M = 150;
export const DEFAULT_GPS_ACCURACY_M = 100;

export function normalizeAccuracy(accuracy: number | null | undefined): number {
  if (accuracy == null || !Number.isFinite(accuracy)) {
    return DEFAULT_GPS_ACCURACY_M;
  }

  return Math.min(MAX_GPS_ACCURACY_M, Math.max(1, accuracy));
}

export function roundCoord(value: number): number {
  const factor = 10 ** COORD_DECIMALS;
  return Math.round(value * factor) / factor;
}

/** EXIF DateTimeOriginal в UTC — exifr на сервере парсит строку как UTC. */
export function formatExifDateTime(date: Date): string {
  return `${date.getUTCFullYear()}:${pad(date.getUTCMonth() + 1)}:${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function formatGpsDateStampUtc(date: Date): string {
  return `${date.getUTCFullYear()}:${pad(date.getUTCMonth() + 1)}:${pad(date.getUTCDate())}`;
}

function createBlankExif(): piexif.IExif {
  return {
    '0th': {},
    Exif: {},
    GPS: {},
    Interop: {},
    '1st': {},
    thumbnail: null,
  };
}

function loadExifFromJpeg(binary: string): piexif.IExif {
  try {
    return piexif.load(binary);
  } catch {
    return createBlankExif();
  }
}

async function readFileBytes(uri: string): Promise<Uint8Array> {
  return new File(uri).bytes();
}

function bytesToBinary(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  const chunks: string[] = [];

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, Math.min(index + chunkSize, bytes.length));
    chunks.push(String.fromCharCode(...chunk));
  }

  return chunks.join('');
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function parseExifDateTimeUtc(dateTime: string): string | null {
  const match = dateTime.match(EXIF_DATE_TIME_PATTERN);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const parsed = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function readGpsCoordinate(
  dms: unknown,
  ref: unknown,
): number | null {
  if (!Array.isArray(dms) || typeof ref !== 'string') {
    return null;
  }

  try {
    const value = piexif.GPSHelper.dmsRationalToDeg(dms as DmsRational, ref);
    return Number.isFinite(value) ? roundCoord(value) : null;
  } catch {
    return null;
  }
}

function applyCaptureMetadataToExif(exifObj: piexif.IExif, metadata: CaptureMetadata): void {
  const lat = roundCoord(metadata.lat);
  const lng = roundCoord(metadata.lng);
  const { altitude, capturedAt } = metadata;
  const dateTime = formatExifDateTime(capturedAt);
  const gpsDateStamp = formatGpsDateStampUtc(capturedAt);

  exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S';
  exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W';
  exifObj.GPS[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lat));
  exifObj.GPS[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lng));
  exifObj.GPS[piexif.GPSIFD.GPSDateStamp] = gpsDateStamp;
  exifObj.GPS[piexif.GPSIFD.GPSTimeStamp] = [
    [capturedAt.getUTCHours(), 1],
    [capturedAt.getUTCMinutes(), 1],
    [capturedAt.getUTCSeconds(), 1],
  ];

  if (altitude != null && Number.isFinite(altitude)) {
    exifObj.GPS[piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(altitude) * 100), 100];
    exifObj.GPS[piexif.GPSIFD.GPSAltitudeRef] = altitude >= 0 ? 0 : 1;
  }

  exifObj['0th'][piexif.ImageIFD.DateTime] = dateTime;
  exifObj.Exif[piexif.ExifIFD.DateTimeOriginal] = dateTime;
  exifObj.Exif[piexif.ExifIFD.DateTimeDigitized] = dateTime;
}

/** Преобразует EXIF DateTimeOriginal в ISO 8601 для POST /stings. */
export function parseExifCapturedAt(exif: ExifRecord | undefined): string | null {
  if (!exif) {
    return null;
  }

  const dateTime = exif.DateTimeOriginal ?? exif.DateTimeDigitized;
  if (typeof dateTime !== 'string') {
    return null;
  }

  const match = dateTime.match(EXIF_DATE_TIME_PATTERN);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const offset = getExifOffset(exif);
  const isoLocal = `${year}-${month}-${day}T${hour}:${minute}:${second}${offset === 'Z' ? 'Z' : offset}`;
  const parsed = new Date(isoLocal);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function buildCaptureExif(
  latitude: number,
  longitude: number,
  altitude: number | null,
): Record<string, number> {
  const exif: Record<string, number> = {
    GPSLatitude: roundCoord(latitude),
    GPSLongitude: roundCoord(longitude),
  };

  if (altitude != null && Number.isFinite(altitude)) {
    exif.GPSAltitude = altitude;
  }

  return exif;
}

/** Читает GPS и время из JPEG после embed через piexif. */
export async function readPhotoMetadataFromFile(uri: string): Promise<PhotoFileMetadata | null> {
  try {
    const bytes = await readFileBytes(uri);
    const exifObj = loadExifFromJpeg(bytesToBinary(bytes));

    const lat = readGpsCoordinate(
      exifObj.GPS[piexif.GPSIFD.GPSLatitude],
      exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef],
    );
    const lng = readGpsCoordinate(
      exifObj.GPS[piexif.GPSIFD.GPSLongitude],
      exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef],
    );
    const dateTime = exifObj.Exif[piexif.ExifIFD.DateTimeOriginal];

    if (lat == null || lng == null || typeof dateTime !== 'string') {
      return null;
    }

    const capturedAt = parseExifDateTimeUtc(dateTime);
    if (!capturedAt) {
      return null;
    }

    return { lat, lng, capturedAt };
  } catch {
    return null;
  }
}

/** Гарантированно записывает GPS и время съёмки в JPEG перед загрузкой. */
export async function embedCaptureMetadataInPhoto(
  sourceUri: string,
  metadata: CaptureMetadata,
): Promise<string> {
  const bytes = await readFileBytes(sourceUri);
  const binary = bytesToBinary(bytes);
  const exifObj = loadExifFromJpeg(binary);

  applyCaptureMetadataToExif(exifObj, {
    ...metadata,
    lat: roundCoord(metadata.lat),
    lng: roundCoord(metadata.lng),
  });

  const updatedBinary = piexif.insert(piexif.dump(exifObj), binary);
  const outputFile = new File(Paths.cache, `sting-${Date.now()}.jpg`);

  outputFile.create({ overwrite: true });
  outputFile.write(binaryToBytes(updatedBinary));

  return outputFile.uri;
}
