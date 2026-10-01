import type { SafetyReportReason } from '@/src/types';

export const SAFETY_COMMENT_MAX_LENGTH = 500;

export function normalizeSafetyComment(raw: string): string | undefined {
  const trimmed = raw.trim().slice(0, SAFETY_COMMENT_MAX_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

export function canSubmitSafetyReport(reason: SafetyReportReason | null, comment: string): boolean {
  if (!reason) {
    return false;
  }

  if (reason === 'other') {
    return normalizeSafetyComment(comment) !== undefined;
  }

  return true;
}
