import type { CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { useCallback, useState, type RefObject } from 'react';

import { useCameraStore } from '@/src/stores/cameraStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';
import { resolveCaptureLocation } from '@/src/utils/capture-location';
import {
  embedCaptureMetadataInPhoto,
  normalizeAccuracy,
  readPhotoMetadataFromFile,
  roundCoord,
} from '@/src/utils/exif';
import { normalizePhotoPixels } from '@/src/utils/photo-orientation';

export type CaptureResult =
  | { ok: true }
  | { ok: false; reason: 'location_denied' | 'location_unavailable' | 'camera' };

export function useCamera(cameraRef: RefObject<CameraView | null>) {
  const setCapture = useCameraStore((state) => state.setCapture);
  const storedCoords = useLocationStore((state) => state.coords);
  const mapRegion = useMapStore((state) => state.region);
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
        quality: 0.7,
        exif: true,
      });

      if (!photo?.uri) {
        return { ok: false, reason: 'camera' };
      }

      const captureMoment = new Date();

      const fallbackCoords = storedCoords
        ? {
            lat: storedCoords.latitude,
            lng: storedCoords.longitude,
            accuracy: storedCoords.accuracy,
          }
        : mapRegion
          ? {
              lat: mapRegion.latitude,
              lng: mapRegion.longitude,
              accuracy: 500,
            }
          : undefined;

      let location: Location.LocationObject;
      try {
        location = await resolveCaptureLocation(fallbackCoords);
      } catch {
        return { ok: false, reason: 'location_unavailable' };
      }

      const { latitude, longitude, altitude, accuracy } = location.coords;

      const normalizedUri = await normalizePhotoPixels(photo.uri);

      const preparedUri = await embedCaptureMetadataInPhoto(normalizedUri, {
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
          usedFallback: Boolean(fallbackCoords),
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
  }, [cameraRef, isCapturing, isReady, mapRegion, setCapture, storedCoords]);

  return {
    isReady,
    setIsReady,
    isCapturing,
    capture,
  };
}
