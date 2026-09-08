import type { CameraCapturedPicture, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { useCallback, useState, type RefObject } from 'react';

import { useCameraStore } from '@/src/stores/cameraStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';
import {
  embedCaptureMetadataInPhoto,
  normalizeAccuracy,
  readPhotoMetadataFromFile,
  roundCoord,
} from '@/src/utils/exif';
import { prepareStingPhotoForUpload } from '@/src/utils/prepare-sting-upload';

/** Исходник промежуточный: итоговая компрессия — в prepareStingPhotoForUpload. */
const CAPTURE_JPEG_QUALITY = 0.9;

export type CaptureResult =
  | { ok: true }
  | { ok: false; reason: 'location_denied' | 'location_unavailable' | 'camera' };

type CaptureCoords = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  source: 'locationStore' | 'mapRegion';
};

function resolveCaptureCoordsFromStore(mapRegion: {
  latitude: number;
  longitude: number;
} | null): CaptureCoords | null {
  const storedCoords = useLocationStore.getState().coords;

  if (storedCoords) {
    return {
      latitude: storedCoords.latitude,
      longitude: storedCoords.longitude,
      altitude: storedCoords.altitude,
      accuracy: storedCoords.accuracy,
      source: 'locationStore',
    };
  }

  if (mapRegion) {
    return {
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      altitude: null,
      accuracy: 500,
      source: 'mapRegion',
    };
  }

  return null;
}

function takePictureWithImmediatePreview(
  camera: CameraView,
  onPreviewUri: (uri: string) => void,
): Promise<CameraCapturedPicture> {
  return new Promise((resolve, reject) => {
    void camera
      .takePictureAsync({
        quality: CAPTURE_JPEG_QUALITY,
        exif: true,
        onPictureSaved: (picture) => {
          if (!picture.uri) {
            reject(new Error('Missing photo uri'));
            return;
          }

          onPreviewUri(picture.uri);
          resolve(picture);
        },
      })
      .catch(reject);
  });
}

export function useCamera(cameraRef: RefObject<CameraView | null>) {
  const setCapture = useCameraStore((state) => state.setCapture);
  const mapRegion = useMapStore((state) => state.region);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturePreviewUri, setCapturePreviewUri] = useState<string | null>(null);

  const clearCapturePreview = useCallback(() => {
    setCapturePreviewUri(null);
  }, []);

  const capture = useCallback(async (): Promise<CaptureResult> => {
    if (!cameraRef.current || !isReady || isCapturing) {
      return { ok: false, reason: 'camera' };
    }

    setIsCapturing(true);

    try {
      const photo = await takePictureWithImmediatePreview(cameraRef.current, setCapturePreviewUri);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return { ok: false, reason: 'location_denied' };
      }

      const captureMoment = new Date();

      const captureCoords = resolveCaptureCoordsFromStore(mapRegion);
      if (!captureCoords) {
        return { ok: false, reason: 'location_unavailable' };
      }

      const { latitude, longitude, altitude, accuracy } = captureCoords;

      const resizedUri = await prepareStingPhotoForUpload(photo.uri, {
        width: photo.width,
        height: photo.height,
      });

      const preparedUri = await embedCaptureMetadataInPhoto(resizedUri, {
        lat: latitude,
        lng: longitude,
        altitude,
        capturedAt: captureMoment,
      });

      const fileMetadata = await readPhotoMetadataFromFile(preparedUri);
      if (!fileMetadata) {
        if (__DEV__) {
          console.warn('[useCamera] EXIF readback failed after embed');
        }
        return { ok: false, reason: 'camera' };
      }

      setCapture({
        capturedUri: preparedUri,
        captureCoords: {
          lat: fileMetadata.lat,
          lng: fileMetadata.lng,
        },
        captureAccuracy: normalizeAccuracy(accuracy),
        capturedAt: fileMetadata.capturedAt,
      });

      if (__DEV__) {
        console.log('[useCamera] capture metadata', {
          requestLat: roundCoord(latitude),
          requestLng: roundCoord(longitude),
          fileLat: fileMetadata.lat,
          fileLng: fileMetadata.lng,
          capturedAt: fileMetadata.capturedAt,
          coordSource: captureCoords.source,
        });
      }

      return { ok: true };
    } catch (error) {
      if (__DEV__) {
        console.warn('[useCamera] capture failed:', error);
      }
      return { ok: false, reason: 'camera' };
    } finally {
      setIsCapturing(false);
      if (!useCameraStore.getState().capturedUri) {
        setCapturePreviewUri(null);
      }
    }
  }, [cameraRef, isCapturing, isReady, mapRegion, setCapture]);

  return {
    isReady,
    setIsReady,
    isCapturing,
    capturePreviewUri,
    clearCapturePreview,
    capture,
  };
}
