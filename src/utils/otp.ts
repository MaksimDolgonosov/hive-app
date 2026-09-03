import type { OtpPurpose } from '@/src/types';

export const OTP_LENGTH = 6;

export const OTP_RESEND_HINT_CODES = new Set(['OTP_EXPIRED', 'OTP_MAX_ATTEMPTS']);

export function sanitizeOtpCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function isOtpComplete(code: string): boolean {
  return code.length === OTP_LENGTH;
}

export function parseOtpPurpose(value: unknown): OtpPurpose | null {
  if (value === 'register' || value === 'password_reset') {
    return value;
  }

  return null;
}

export function firstRouteParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
