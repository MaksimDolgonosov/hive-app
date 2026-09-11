import { HIVE_ACTIVATION_THRESHOLD } from '@/src/utils/hive';

const BASE_MARKER_SIZE = 52;
const MAX_MARKER_SIZE = 72;
const MAX_COUNT_FOR_SCALE = 15;
const BASE_COUNT_FONT_SIZE = 16;
const MAX_COUNT_FONT_SIZE = 22;
const BASE_CORNER_RADIUS = 6;
const MAX_CORNER_RADIUS = 8;
const BASE_STROKE_WIDTH = 1.5;
const MAX_STROKE_WIDTH = 2;

export type HiveMarkerVisualMetrics = {
  markerSize: number;
  countFontSize: number;
  cornerRadius: number;
  strokeWidth: number;
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

  return {
    markerSize,
    countFontSize: Math.round(
      BASE_COUNT_FONT_SIZE + progress * (MAX_COUNT_FONT_SIZE - BASE_COUNT_FONT_SIZE),
    ),
    cornerRadius: BASE_CORNER_RADIUS + progress * (MAX_CORNER_RADIUS - BASE_CORNER_RADIUS),
    strokeWidth: BASE_STROKE_WIDTH + progress * (MAX_STROKE_WIDTH - BASE_STROKE_WIDTH),
    pulseDurationMs: Math.round(2200 - progress * 700),
    pulseMaxScale: 1.04 + progress * 0.08,
    circleFillOpacityMin: 0.22 + progress * 0.04,
    circleFillOpacityMax: 0.32 + progress * 0.1,
  };
}
