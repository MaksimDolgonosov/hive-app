import { HIVE_ACTIVATION_THRESHOLD } from '@/src/utils/hive';

const BASE_MARKER_SIZE = 52;
const MAX_MARKER_SIZE = 68;
const MAX_COUNT_FOR_SCALE = 15;

export type HiveMarkerVisualMetrics = {
  markerSize: number;
  iconSize: number;
  countFontSize: number;
  pulseDurationMs: number;
  pulseMaxScale: number;
  circleFillOpacityMin: number;
  circleFillOpacityMax: number;
};

function normalizeCount(activeStingsCount: number): number {
  return Math.max(activeStingsCount, HIVE_ACTIVATION_THRESHOLD);
}

function scaleProgress(count: number): number {
  const range = MAX_COUNT_FOR_SCALE - HIVE_ACTIVATION_THRESHOLD;
  if (range <= 0) {
    return 0;
  }

  return Math.min(1, (count - HIVE_ACTIVATION_THRESHOLD) / range);
}

export function getHiveMarkerVisualMetrics(activeStingsCount: number): HiveMarkerVisualMetrics {
  const count = normalizeCount(activeStingsCount);
  const progress = scaleProgress(count);
  const markerSize = Math.round(BASE_MARKER_SIZE + progress * (MAX_MARKER_SIZE - BASE_MARKER_SIZE));
  const sizeRatio = markerSize / BASE_MARKER_SIZE;

  return {
    markerSize,
    iconSize: Math.round(18 * sizeRatio),
    countFontSize: Math.round(10 * sizeRatio),
    pulseDurationMs: Math.round(2200 - progress * 700),
    pulseMaxScale: 1.04 + progress * 0.08,
    circleFillOpacityMin: 0.22 + progress * 0.04,
    circleFillOpacityMax: 0.32 + progress * 0.1,
  };
}
