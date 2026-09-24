import type { CameraCapturedPicture, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { useCallback, useState, type RefObject } from 'react';

import { useLocationStore } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';
import { embedCaptureMetadataInPhoto, normalizeAccuracy, readPhotoMetadataFromFile } from '@/src/utils/exif';
import { prepareStingPhotoForUpload } from '@/src/utils/prepare-sting-upload';

const CAPTURE_JPEG_QUALITY = 0.9;

export type OnsiteCapture =
  | {
      ok: true;
      uri: string;
      lat: number;
      lng: number;
      accuracy: number;
      capturedAt: string;
    }
  | { ok: false; reason: 'location_denied' | 'location_unavailable' | 'camera' };

export function useOnsiteCapture(cameraRef: RefObject<CameraView | null>) {
  const mapRegion = useMapStore((state) => state.region);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(async (): Promise<OnsiteCapture> => {
    if (!cameraRef.current || !isReady || isCapturing) {
      return { ok: false, reason: 'camera' };
    }

    setIsCapturing(true);
    try {
      const photo = await new Promise<CameraCapturedPicture>((resolve, reject) => {
        void cameraRef.current
          ?.takePictureAsync({
            quality: CAPTURE_JPEG_QUALITY,
            exif: true,
            onPictureSaved: (picture) => {
              if (!picture.uri) {
                reject(new Error('Missing photo uri'));
                return;
              }
              resolve(picture);
            },
          })
          .catch(reject);
      });

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return { ok: false, reason: 'location_denied' };
      }

      const stored = useLocationStore.getState().coords;
      const latitude = stored?.latitude ?? mapRegion?.latitude;
      const longitude = stored?.longitude ?? mapRegion?.longitude;
      if (latitude == null || longitude == null) {
        return { ok: false, reason: 'location_unavailable' };
      }

      const captureMoment = new Date();
      const resizedUri = await prepareStingPhotoForUpload(photo.uri, {
        width: photo.width,
        height: photo.height,
      });
      const preparedUri = await embedCaptureMetadataInPhoto(resizedUri, {
        lat: latitude,
        lng: longitude,
        altitude: stored?.altitude ?? null,
        capturedAt: captureMoment,
      });
      const fileMetadata = await readPhotoMetadataFromFile(preparedUri);
      if (!fileMetadata) {
        return { ok: false, reason: 'camera' };
      }

      return {
        ok: true,
        uri: preparedUri,
        lat: fileMetadata.lat,
        lng: fileMetadata.lng,
        accuracy: normalizeAccuracy(stored?.accuracy ?? null),
        capturedAt: fileMetadata.capturedAt,
      };
    } catch {
      return { ok: false, reason: 'camera' };
    } finally {
      setIsCapturing(false);
    }
  }, [cameraRef, isCapturing, isReady, mapRegion]);

  return { isReady, setIsReady, isCapturing, capture };
}
