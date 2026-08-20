/** Базовый URL аватара без query-параметров кэша. */
export function getAvatarBaseUrl(avatarUrl: string): string {
  return avatarUrl.split('?')[0] ?? avatarUrl;
}

/**
 * URI для отображения аватара с cache-bust.
 * При замене фото URL на сервере часто не меняется (тот же path) — без версии клиент показывает старое из кэша.
 */
export function buildAvatarDisplayUri(avatarUrl: string, cacheVersion: number): string {
  const base = getAvatarBaseUrl(avatarUrl);

  if (cacheVersion > 0) {
    return `${base}?v=${cacheVersion}`;
  }

  if (avatarUrl.includes('?')) {
    return avatarUrl;
  }

  return base;
}
