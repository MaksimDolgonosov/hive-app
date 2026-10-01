import { describe, expect, it } from 'vitest';

import { canSubmitSafetyReport, normalizeSafetyComment } from '@/src/utils/safety-report';

describe('safety report form', () => {
  it('requires a reason', () => {
    expect(canSubmitSafetyReport(null, 'text')).toBe(false);
  });

  it('sends a chosen reason without a comment', () => {
    expect(canSubmitSafetyReport('spam', '   ')).toBe(true);
  });

  it('requires a comment for other', () => {
    expect(canSubmitSafetyReport('other', '   ')).toBe(false);
    expect(canSubmitSafetyReport('other', 'stolen caption')).toBe(true);
  });

  it('drops an empty comment and caps the length', () => {
    expect(normalizeSafetyComment('   ')).toBeUndefined();
    expect(normalizeSafetyComment(`  ${'a'.repeat(600)}  `)).toHaveLength(500);
  });
});
