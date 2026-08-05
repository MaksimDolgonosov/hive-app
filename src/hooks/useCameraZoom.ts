import type { CameraView } from 'expo-camera';
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react';
import { Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import {
  findWideAngleLens,
  getLensForPreset,
  presetToNormalizedZoom,
  type ZoomPreset,
} from '@/src/utils/camera-zoom';

const MIN_ZOOM = 0;
const MAX_ZOOM = 1;
const PINCH_SENSITIVITY = 0.5;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function useCameraZoom(
  cameraRef: RefObject<CameraView | null>,
  facing: 'front' | 'back',
) {
  const [zoom, setZoomState] = useState(MIN_ZOOM);
  const [activePreset, setActivePreset] = useState<ZoomPreset>(1);
  const [selectedLens, setSelectedLens] = useState<string | undefined>();
  const [availableLenses, setAvailableLenses] = useState<string[]>([]);

  const zoomShared = useSharedValue(MIN_ZOOM);
  const zoomOffset = useSharedValue(MIN_ZOOM);

  const applyNormalizedZoom = useCallback(
    (value: number, preset: ZoomPreset) => {
      const clamped = clampZoom(value);
      zoomShared.value = clamped;
      setZoomState(clamped);
      setActivePreset(preset);
    },
    [zoomShared],
  );

  const applyPreset = useCallback(
    (preset: ZoomPreset, lenses: string[]) => {
      const lens = getLensForPreset(preset, lenses);
      setSelectedLens(lens);
      applyNormalizedZoom(presetToNormalizedZoom(preset), preset);
    },
    [applyNormalizedZoom],
  );

  const setPreset = useCallback(
    (preset: ZoomPreset) => {
      if (facing === 'front' && preset !== 1) {
        return;
      }

      applyPreset(preset, availableLenses);
    },
    [applyPreset, availableLenses, facing],
  );

  const applyPinchZoom = useCallback(
    (value: number) => {
      const clamped = clampZoom(value);
      zoomShared.value = clamped;
      setZoomState(clamped);
      setActivePreset(1);
      setSelectedLens(findWideAngleLens(availableLenses));
    },
    [availableLenses, zoomShared],
  );

  const syncAvailableLenses = useCallback(async () => {
    if (Platform.OS !== 'ios' || !cameraRef.current) {
      setAvailableLenses([]);
      return;
    }

    try {
      const lenses = await cameraRef.current.getAvailableLensesAsync();
      setAvailableLenses(lenses);
    } catch {
      setAvailableLenses([]);
    }
  }, [cameraRef]);

  useEffect(() => {
    if (activePreset === 0.5 && availableLenses.length > 0) {
      setSelectedLens(getLensForPreset(0.5, availableLenses));
    }
  }, [activePreset, availableLenses]);

  useEffect(() => {
    setAvailableLenses([]);
    setSelectedLens(undefined);
    applyNormalizedZoom(MIN_ZOOM, 1);
  }, [facing, applyNormalizedZoom]);

  const onCameraReady = useCallback(async () => {
    await syncAvailableLenses();
    applyNormalizedZoom(MIN_ZOOM, 1);
    setSelectedLens(undefined);
  }, [applyNormalizedZoom, syncAvailableLenses]);

  const onAvailableLensesChanged = useCallback(
    ({ lenses }: { lenses: string[] }) => {
      setAvailableLenses(lenses);

      if (activePreset === 0.5) {
        setSelectedLens(getLensForPreset(0.5, lenses));
        return;
      }

      if (activePreset === 1 && lenses.length > 0) {
        setSelectedLens(getLensForPreset(1, lenses));
      }
    },
    [activePreset],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(() => {
          zoomOffset.value = zoomShared.value;
        })
        .onUpdate((event) => {
          const next = zoomOffset.value + (event.scale - 1) * PINCH_SENSITIVITY;
          runOnJS(applyPinchZoom)(next);
        }),
    [applyPinchZoom, zoomOffset, zoomShared],
  );

  return {
    zoom,
    activePreset,
    selectedLens,
    availableLenses,
    setPreset,
    pinchGesture,
    onCameraReady,
    onAvailableLensesChanged,
  };
}
