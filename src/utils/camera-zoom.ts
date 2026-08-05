export const ZOOM_PRESETS = [0.5, 1, 2, 3] as const;

export type ZoomPreset = (typeof ZOOM_PRESETS)[number];

/** Предполагаемый максимальный зум устройства (для маппинга 2× / 3× в 0…1). */
const ASSUMED_MAX_ZOOM_FACTOR = 10;

function normalizeLensName(name: string): string {
  return name.toLowerCase();
}

function isUltraWideLensName(name: string): boolean {
  const lower = normalizeLensName(name);

  return (
    lower.includes('ultra wide') ||
    lower.includes('ultra-wide') ||
    lower.includes('ultrawide') ||
    lower.includes('надширок') ||
    lower.includes('超広') ||
    lower.includes('grand angle')
  );
}

function isTelephotoLensName(name: string): boolean {
  const lower = normalizeLensName(name);

  return lower.includes('telephoto') || lower.includes('телефото') || lower.includes('望遠');
}

function isVirtualCameraName(name: string): boolean {
  const lower = normalizeLensName(name);

  return lower.includes('dual') || lower.includes('triple') || lower.includes('dual wide');
}

function isWideAngleLensName(name: string): boolean {
  if (isUltraWideLensName(name) || isTelephotoLensName(name) || isVirtualCameraName(name)) {
    return false;
  }

  const lower = normalizeLensName(name);

  return (
    lower.includes('wide') ||
    lower.includes('широк') ||
    lower.includes('广角') ||
    lower.includes('camera') ||
    lower.includes('камер')
  );
}

/** expo-camera на iOS принимает localizedName, а не deviceType. */
export function findUltraWideLens(lenses: string[]): string | undefined {
  return lenses.find(isUltraWideLensName);
}

export function findWideAngleLens(lenses: string[]): string | undefined {
  const explicitWide = lenses.find(isWideAngleLensName);
  if (explicitWide) {
    return explicitWide;
  }

  return lenses.find(
    (name) =>
      !isUltraWideLensName(name) && !isTelephotoLensName(name) && !isVirtualCameraName(name),
  );
}

export function presetToNormalizedZoom(preset: ZoomPreset): number {
  if (preset <= 1) {
    return 0;
  }

  return Math.min(1, (preset - 1) / (ASSUMED_MAX_ZOOM_FACTOR - 1));
}

export function getLensForPreset(
  preset: ZoomPreset,
  availableLenses: string[],
): string | undefined {
  if (availableLenses.length === 0) {
    return undefined;
  }

  if (preset === 0.5) {
    return findUltraWideLens(availableLenses);
  }

  if (preset === 1) {
    return findWideAngleLens(availableLenses);
  }

  return findWideAngleLens(availableLenses);
}

export function isPresetAvailable(
  preset: ZoomPreset,
  facing: 'front' | 'back',
  availableLenses: string[],
): boolean {
  if (facing === 'front') {
    return preset === 1;
  }

  if (preset === 0.5) {
    return findUltraWideLens(availableLenses) !== undefined;
  }

  return true;
}

export function formatZoomPresetLabel(preset: ZoomPreset): string {
  return preset === 1 ? '1×' : `${preset}×`;
}
