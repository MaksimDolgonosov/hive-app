import type { AuthTokens } from '@/src/types';

type AuthSessionSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthSessionHandlers = {
  refreshTokens: (refreshToken: string) => Promise<AuthTokens | null>;
  clearSession: () => Promise<void>;
};

let snapshot: AuthSessionSnapshot = {
  accessToken: null,
  refreshToken: null,
};

let handlers: AuthSessionHandlers | null = null;

export function registerAuthSessionHandlers(next: AuthSessionHandlers): void {
  handlers = next;
}

export function setAuthSessionTokens(
  accessToken: string | null,
  refreshToken: string | null,
): void {
  snapshot = { accessToken, refreshToken };
}

export function getAccessToken(): string | null {
  return snapshot.accessToken;
}

export async function refreshAccessTokenViaSession(): Promise<string | null> {
  if (!handlers) {
    return null;
  }

  if (!snapshot.refreshToken) {
    await handlers.clearSession();
    return null;
  }

  try {
    const tokens = await handlers.refreshTokens(snapshot.refreshToken);
    if (!tokens) {
      await handlers.clearSession();
      return null;
    }

    setAuthSessionTokens(tokens.accessToken, tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    await handlers.clearSession();
    return null;
  }
}
