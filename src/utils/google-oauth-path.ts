/** Google installed-app callback, e.g. `com.googleusercontent.apps…:/oauth2redirect`. */
export function isGoogleOAuthCallbackPath(path: string): boolean {
  const normalized = path.toLowerCase();
  return normalized.includes('oauth2redirect') || normalized.includes('googleusercontent.apps');
}
