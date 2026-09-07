import { create } from 'zustand';

import * as authApi from '@/src/api/auth';
import { registerAuthSessionHandlers, setAuthSessionTokens } from '@/src/api/auth-session';
import type {
  AuthStatus,
  AuthTokens,
  ForgotPasswordInput,
  OtpChallengeResponse,
  OtpPurpose,
  ResetPasswordInput,
  User,
  VerifyOtpInput,
} from '@/src/types';
import { getApiErrorCode, getApiErrorRetryAfterSec } from '@/src/utils/api-error';

import {
  loadOnboardingCompleted,
  saveOnboardingCompleted,
  clearOnboardingCompleted,
} from './onboarding-storage';
import { clearTokens, loadTokens, saveTokens } from './secure-storage';

type ResetPasswordResult = 'session' | 'login_required';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;
  /** True while Google OAuth prompt / token exchange is in flight. */
  socialAuthPending: boolean;
  /** Меняется при upload/remove аватара — сбрасывает кэш expo-image. */
  avatarCacheVersion: number;
  pendingEmail: string | null;
  otpPurpose: OtpPurpose | null;
  otpExpiresAt: number | null;
  otpResendAvailableAt: number | null;
  setSession: (user: User, tokens: AuthTokens) => Promise<void>;
  setUser: (user: User) => void;
  bumpAvatarCacheVersion: () => void;
  setSocialAuthPending: (value: boolean) => void;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setPendingOtp: (input: {
    email: string;
    purpose: OtpPurpose;
    expiresInSec?: number;
    resendAvailableInSec?: number;
  }) => void;
  setOtpResendAvailableAt: (availableAtMs: number) => void;
  clearPendingOtp: () => void;
  register: (input: { email: string; password: string; username: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (input: { idToken: string }) => Promise<void>;
  verifyOtp: (input: VerifyOtpInput) => Promise<void>;
  resendOtp: (input: { email: string; purpose: OtpPurpose }) => Promise<void>;
  forgotPassword: (input: ForgotPasswordInput) => Promise<void>;
  resetPassword: (input: ResetPasswordInput) => Promise<ResetPasswordResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

function toTimestamp(seconds: number | undefined): number | null {
  if (seconds == null || !Number.isFinite(seconds)) {
    return null;
  }

  return Date.now() + Math.max(0, seconds) * 1000;
}

function pendingFromChallenge(challenge: OtpChallengeResponse) {
  return {
    pendingEmail: challenge.email,
    otpPurpose: challenge.purpose,
    otpExpiresAt: toTimestamp(challenge.expiresInSec),
    otpResendAvailableAt: toTimestamp(challenge.resendAvailableInSec),
  };
}

const EMPTY_PENDING_OTP = {
  pendingEmail: null,
  otpPurpose: null,
  otpExpiresAt: null,
  otpResendAvailableAt: null,
} as const;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  hasCompletedOnboarding: false,
  isHydrated: false,
  socialAuthPending: false,
  avatarCacheVersion: 0,
  pendingEmail: null,
  otpPurpose: null,
  otpExpiresAt: null,
  otpResendAvailableAt: null,

  setSession: async (user, tokens) => {
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    setAuthSessionTokens(tokens.accessToken, tokens.refreshToken);
    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
      ...EMPTY_PENDING_OTP,
    });
  },

  setUser: (user) => {
    set({ user });
  },

  bumpAvatarCacheVersion: () => {
    set({ avatarCacheVersion: Date.now() });
  },

  setSocialAuthPending: (value) => {
    set({ socialAuthPending: value });
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

  setPendingOtp: ({ email, purpose, expiresInSec, resendAvailableInSec }) => {
    const sameEmail = get().pendingEmail === email;
    set({
      pendingEmail: email,
      otpPurpose: purpose,
      otpExpiresAt: toTimestamp(expiresInSec) ?? (sameEmail ? get().otpExpiresAt : null),
      otpResendAvailableAt:
        toTimestamp(resendAvailableInSec) ?? (sameEmail ? get().otpResendAvailableAt : null),
    });
  },

  setOtpResendAvailableAt: (availableAtMs) => {
    set({ otpResendAvailableAt: availableAtMs });
  },

  clearPendingOtp: () => {
    set({ ...EMPTY_PENDING_OTP });
  },

  register: async (input) => {
    const challenge = await authApi.register(input);
    set(pendingFromChallenge(challenge));
  },

  login: async (input) => {
    await get().clearSession();
    const { user, tokens } = await authApi.login(input);
    await get().setSession(user, tokens);
  },

  loginWithGoogle: async (input) => {
    if (get().refreshToken || get().accessToken) {
      await get().clearSession();
    }
    const { user, tokens } = await authApi.loginWithGoogle(input);
    await get().setSession(user, tokens);
  },

  verifyOtp: async (input) => {
    const { user, tokens } = await authApi.verifyOtp(input);
    await get().setSession(user, tokens);
  },

  resendOtp: async (input) => {
    try {
      const challenge = await authApi.resendOtp(input);
      set(pendingFromChallenge(challenge));
    } catch (error) {
      if (getApiErrorCode(error) === 'OTP_RESEND_COOLDOWN') {
        const retryAfterSec = getApiErrorRetryAfterSec(error);
        if (retryAfterSec != null) {
          set({ otpResendAvailableAt: toTimestamp(retryAfterSec) });
        }
      }
      throw error;
    }
  },

  forgotPassword: async (input) => {
    const challenge = await authApi.forgotPassword(input);
    set(pendingFromChallenge(challenge));
  },

  resetPassword: async (input) => {
    const session = await authApi.resetPassword(input);
    get().clearPendingOtp();

    if (session) {
      await get().setSession(session.user, session.tokens);
      return 'session';
    }

    return 'login_required';
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
