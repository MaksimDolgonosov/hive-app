import type { Sting } from '@/src/types';

/** Доля прожитой жизни, ниже которой жало считается свежим (§9.2). */
export const STING_FRESH_PROGRESS_MAX = 0.15;

/** Доля прожитой жизни, выше которой жало скоро истечёт (§9.2). */
export const STING_EXPIRING_PROGRESS_MIN = 0.85;

export function getStingProgress(
  sting: Pick<Sting, 'createdAt' | 'expiresAt'>,
  now = Date.now(),
): number | null {
  const createdMs = new Date(sting.createdAt).getTime();
  const expiresMs = new Date(sting.expiresAt).getTime();

  if (!Number.isFinite(createdMs) || !Number.isFinite(expiresMs)) {
    return null;
  }

  const life = expiresMs - createdMs;
  if (life <= 0) {
    return null;
  }

  return (now - createdMs) / life;
}

export function isFreshSting(
  sting: Pick<Sting, 'createdAt' | 'expiresAt'>,
  now = Date.now(),
): boolean {
  const progress = getStingProgress(sting, now);
  return progress !== null && progress <= STING_FRESH_PROGRESS_MAX;
}

export function isExpiringSting(
  sting: Pick<Sting, 'createdAt' | 'expiresAt'>,
  now = Date.now(),
): boolean {
  const progress = getStingProgress(sting, now);
  return progress !== null && progress >= STING_EXPIRING_PROGRESS_MIN;
}
