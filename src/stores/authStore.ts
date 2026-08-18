import { create } from 'zustand';

import * as authApi from '@/src/api/auth';
import {
  registerAuthSessionHandlers,
  setAuthSessionTokens,
} from '@/src/api/auth-session';
import type { AuthStatus, AuthTokens, User } from '@/src/types';

import { loadOnboardingCompleted, saveOnboardingCompleted, clearOnboardingCompleted } from './onboarding-storage';
import { clearTokens, loadTokens, saveTokens } from './secure-storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;
  setSession: (user: User, tokens: AuthTokens) => Promise<void>;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  register: (input: { email: string; password: string; username: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  hasCompletedOnboarding: false,
  isHydrated: false,

  setSession: async (user, tokens) => {
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    setAuthSessionTokens(tokens.accessToken, tokens.refreshToken);
    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    });
  },

  setTokens: async (tokens) => {
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    setAuthSessionTokens(tokens.accessToken, tokens.refreshToken);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  clearSession: async () => {
    await clearTokens();
    setAuthSessionTokens(null, null);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'unauthenticated',
    });
  },

  hydrate: async () => {
    if (__DEV__ && process.env.EXPO_PUBLIC_RESET_ONBOARDING === 'true') {
      await clearOnboardingCompleted();
    }

    const hasCompletedOnboarding = await loadOnboardingCompleted();
    const { accessToken, refreshToken } = await loadTokens();

    if (!refreshToken) {
      set({ hasCompletedOnboarding, status: 'unauthenticated', isHydrated: true });
      return;
    }

    set({ accessToken, refreshToken, hasCompletedOnboarding });
    setAuthSessionTokens(accessToken, refreshToken);

    try {
      const { user } = await authApi.getMe();
      set({ user, status: 'authenticated', isHydrated: true });
      return;
    } catch {
      // accessToken might be expired — try refresh below
    }

    try {
      const { tokens } = await authApi.refresh(refreshToken);
      await get().setTokens(tokens);
      const { user } = await authApi.getMe();
      set({ user, status: 'authenticated', isHydrated: true });
    } catch {
      await get().clearSession();
      set({ hasCompletedOnboarding, isHydrated: true });
    }
  },

  completeOnboarding: async () => {
    await saveOnboardingCompleted();
    set({ hasCompletedOnboarding: true });
  },

  resetOnboarding: async () => {
    await clearOnboardingCompleted();
    set({ hasCompletedOnboarding: false });
  },

  register: async (input) => {
    const { user, tokens } = await authApi.register(input);
    await get().setSession(user, tokens);
  },

  login: async (input) => {
    await get().clearSession();
    const { user, tokens } = await authApi.login(input);
    await get().setSession(user, tokens);
  },

  logout: async () => {
    const refreshToken = get().refreshToken;
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Server-side revoke is best-effort; local session is always cleared.
      }
    }
    await get().clearSession();
  },

  refreshUser: async () => {
    if (get().status !== 'authenticated') {
      return;
    }

    try {
      const { user } = await authApi.getMe();
      set({ user });
    } catch {
      // Keep cached user if refresh fails transiently.
    }
  },
}));

registerAuthSessionHandlers({
  refreshTokens: async (refreshToken) => {
    try {
      const { tokens } = await authApi.refresh(refreshToken);
      await useAuthStore.getState().setTokens(tokens);
      return tokens;
    } catch {
      return null;
    }
  },
  clearSession: async () => {
    await useAuthStore.getState().clearSession();
  },
});
