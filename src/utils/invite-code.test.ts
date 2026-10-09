import { describe, expect, it } from 'vitest';

import type { Invite } from '@/src/types';
import {
  isCompleteInviteCode,
  normalizeInviteCode,
  pickActiveInvite,
} from '@/src/utils/invite-code';

const NOW = Date.parse('2026-10-07T12:00:00Z');

function invite(overrides: Partial<Invite>): Invite {
  return {
    code: 'H7K2M9QA',
    usesLimit: 5,
    usesCount: 0,
    createdAt: '2026-10-01T12:00:00Z',
    expiresAt: '2026-10-31T12:00:00Z',
    ...overrides,
  };
}

describe('normalizeInviteCode', () => {
  it('uppercases and strips separators', () => {
    expect(normalizeInviteCode(' h7k2-m9qa ')).toBe('H7K2M9QA');
  });

  it('cuts input to the code length', () => {
    expect(normalizeInviteCode('H7K2M9QAXYZ')).toBe('H7K2M9QA');
  });

  it('extracts the code from a pasted invite link', () => {
    expect(normalizeInviteCode('https://hive-app.site/i/h7k2m9qa?utm=chat')).toBe('H7K2M9QA');
  });

  it('drops non-latin characters', () => {
    expect(normalizeInviteCode('Н7К2')).toBe('72');
  });
});

describe('isCompleteInviteCode', () => {
  it('accepts only full-length codes', () => {
    expect(isCompleteInviteCode('H7K2M9QA')).toBe(true);
    expect(isCompleteInviteCode('H7K2')).toBe(false);
  });
});

describe('pickActiveInvite', () => {
  it('skips expired and exhausted invites', () => {
    const active = invite({ code: 'ACTIVE01' });
    const result = pickActiveInvite(
      [
        invite({ code: 'EXPIRED1', expiresAt: '2026-10-06T12:00:00Z' }),
        invite({ code: 'USEDUP01', usesCount: 5 }),
        active,
      ],
      NOW,
    );

    expect(result).toBe(active);
  });

  it('returns null when nothing is usable', () => {
    expect(pickActiveInvite([invite({ expiresAt: '2026-10-07T11:59:59Z' })], NOW)).toBeNull();
    expect(pickActiveInvite([], NOW)).toBeNull();
  });
});
