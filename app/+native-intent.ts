import { isGoogleOAuthCallbackPath } from '@/src/utils/google-oauth-path';
import { parseDeeplink } from '@/src/utils/deeplink';
import { savePendingInviteCode } from '@/src/stores/invite-storage';

/**
 * Google OAuth returns to a custom scheme that is not an app route.
 * Returning null keeps the current screen so expo-auth-session can finish
 * without Expo Router showing +not-found or remounting login.
 *
 * Cold start (`initial`) still needs a real route, otherwise the app opens on tabs.
 *
 * Invite links (`/i/{code}`) are handled after the OAuth check so Google login
 * is not broken (`RN_FRONTEND_TZ.md` §8).
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string | null {
  try {
    if (isGoogleOAuthCallbackPath(path)) {
      if (initial) {
        return '/(auth)/login';
      }

      return null;
    }

    const parsed = parseDeeplink(path);
    if (parsed.kind === 'invite') {
      void savePendingInviteCode(parsed.code);
      return '/(auth)/register';
    }

    if (parsed.kind === 'place') {
      return `/(modals)/place/${parsed.id}?source=deeplink`;
    }

    return path;
  } catch {
    return path;
  }
}
