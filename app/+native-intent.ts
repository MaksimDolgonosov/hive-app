import { isGoogleOAuthCallbackPath } from '@/src/utils/google-oauth-path';

/**
 * Google OAuth returns to a custom scheme that is not an app route.
 * Returning null keeps the current screen so expo-auth-session can finish
 * without Expo Router showing +not-found or remounting login.
 *
 * Cold start (`initial`) still needs a real route, otherwise the app opens on tabs.
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string | null {
  try {
    if (!isGoogleOAuthCallbackPath(path)) {
      return path;
    }

    if (initial) {
      return '/(auth)/login';
    }

    return null;
  } catch {
    return path;
  }
}
