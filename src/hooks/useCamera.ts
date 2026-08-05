import type { CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { useCallback, useState, type RefObject } from 'react';

import { useCameraStore } from '@/src/stores/cameraStore';
import {
  embedCaptureMetadataInPhoto,
  normalizeAccuracy,
  readPhotoMetadataFromFile,
  roundCoord,
} from '@/src/utils/exif';

export type CaptureResult =
  | { ok: true }
  | { ok: false; reason: 'location_denied' | 'camera' };

async function resolveCaptureLocation(): Promise<Location.LocationObject> {
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 60_000,
      requiredAccuracy: 200,
    });

    if (lastKnown) {
      return lastKnown;
    }

    throw new Error('Location unavailable');
  }
}

export function useCamera(cameraRef: RefObject<CameraView | null>) {
  const setCapture = useCameraStore((state) => state.setCapture);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(async (): Promise<CaptureResult> => {
    if (!cameraRef.current || !isReady || isCapturing) {
      return { ok: false, reason: 'camera' };
    }

    setIsCapturing(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return { ok: false, reason: 'location_denied' };
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        exif: true,
      });

      if (!photo?.uri) {
        return { ok: false, reason: 'camera' };
      }

      const captureMoment = new Date();
      const location = await resolveCaptureLocation();
      const { latitude, longitude, altitude, accuracy } = location.coords;

      const preparedUri = await embedCaptureMetadataInPhoto(photo.uri, {
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
    }
  }, [cameraRef, isCapturing, isReady, setCapture]);

  return {
    isReady,
    setIsReady,
    isCapturing,
    capture,
  };
}
