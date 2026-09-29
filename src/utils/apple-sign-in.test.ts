import { describe, expect, it } from 'vitest';

import { formatAppleFullName, isAppleCancel } from '@/src/utils/apple-sign-in';

describe('formatAppleFullName', () => {
  it('joins the name Apple sends only on the first authorization', () => {
    expect(formatAppleFullName({ givenName: 'Ada', familyName: 'Lovelace' })).toBe('Ada Lovelace');
  });

  it('returns null when Apple omits the name', () => {
    expect(formatAppleFullName(null)).toBeNull();
    expect(formatAppleFullName({ givenName: '  ', familyName: null })).toBeNull();
  });
});

describe('isAppleCancel', () => {
  it('treats the system cancel code as a silent dismiss', () => {
    expect(isAppleCancel({ code: 'ERR_REQUEST_CANCELED' })).toBe(true);
    expect(isAppleCancel({ code: 'ERR_REQUEST_FAILED' })).toBe(false);
    expect(isAppleCancel(new Error('fail'))).toBe(false);
  });
});
