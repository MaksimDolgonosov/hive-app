import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import type { GeoPoint } from '@/src/types';

interface CaptureData {
  capturedUri: string;
  captureCoords: GeoPoint;
  captureAccuracy: number;
  capturedAt: string;
}

interface CameraState {
  capturedUri: string | null;
  captureCoords: GeoPoint | null;
  captureAccuracy: number | null;
  capturedAt: string | null;
  idempotencyKey: string | null;
  isCameraCapture: boolean;
  beginPublishFlow: () => string;
  setCapture: (data: CaptureData) => void;
  clearPhoto: () => void;
  clearCapture: () => void;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  capturedUri: null,
  captureCoords: null,
  captureAccuracy: null,
  capturedAt: null,
  idempotencyKey: null,
  isCameraCapture: false,

  beginPublishFlow: () => {
    const existingKey = get().idempotencyKey;
    if (existingKey) {
      return existingKey;
    }

    const idempotencyKey = Crypto.randomUUID();
    set({
      idempotencyKey,
      capturedUri: null,
      captureCoords: null,
      captureAccuracy: null,
      capturedAt: null,
      isCameraCapture: false,
    });
    return idempotencyKey;
  },

  setCapture: (data) =>
    set({
      capturedUri: data.capturedUri,
      captureCoords: data.captureCoords,
      captureAccuracy: data.captureAccuracy,
      capturedAt: data.capturedAt,
      isCameraCapture: true,
    }),

  clearPhoto: () =>
    set({
      capturedUri: null,
      captureCoords: null,
      captureAccuracy: null,
      capturedAt: null,
      isCameraCapture: false,
    }),

  clearCapture: () =>
    set({
      capturedUri: null,
      captureCoords: null,
      captureAccuracy: null,
      capturedAt: null,
      idempotencyKey: null,
      isCameraCapture: false,
    }),
}));
