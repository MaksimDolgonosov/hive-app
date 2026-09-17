import type { AccountType } from '@/src/types';

const KNOWN_ACCOUNT_TYPES = new Set<AccountType>(['personal', 'partner', 'official']);

/** Неизвестное значение трактуется как `personal` — forward compatibility (§G11). */
export function resolveAccountType(value: string | null | undefined): AccountType {
  if (value && KNOWN_ACCOUNT_TYPES.has(value as AccountType)) {
    return value as AccountType;
  }

  return 'personal';
}

export function hasAccountTypeBadge(value: string | null | undefined): boolean {
  const type = resolveAccountType(value);
  return type === 'partner' || type === 'official';
}
