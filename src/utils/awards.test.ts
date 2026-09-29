import { beforeEach, describe, expect, it, vi } from 'vitest';

import { en } from '@/src/i18n/locales/en';
import { ru } from '@/src/i18n/locales/ru';
import {
  announceAwards,
  formatAwardToastMessage,
  getAwardCopy,
  nextAwardsPageParam,
} from '@/src/utils/awards';

const showInfoToast = vi.hoisted(() => vi.fn());

vi.mock('@/src/i18n', async () => {
  const { ru: dictionary } = await import('@/src/i18n/locales/ru');

  return {
    default: {
      t: (key: string) => {
        const [section, field] = key.split('.');
        const bucket = dictionary[section as keyof typeof dictionary] as Record<string, string>;
        const value = bucket[field];

        if (!value) {
          throw new Error(`Missing translation ${key}`);
        }

        return value;
      },
    },
  };
});

vi.mock('@/src/stores/toastStore', () => ({
  showInfoToast,
}));

const COPY_KEYS = [
  ['zoneFirst', 'zoneFirstHint'],
  ['zoneRevival', 'zoneRevivalHint'],
  ['hiveIgnited', 'hiveIgnitedHint'],
  ['hiveFounder', 'hiveFounderHint'],
] as const;

describe('award copy', () => {
  it('keeps Russian and English strings for every award', () => {
    for (const [title, hint] of COPY_KEYS) {
      expect(ru.awards[title].length).toBeGreaterThan(0);
      expect(ru.awards[hint].length).toBeGreaterThan(0);
      expect(en.awards[title].length).toBeGreaterThan(0);
      expect(en.awards[hint].length).toBeGreaterThan(0);
    }

    expect(ru.awards.unknown.length).toBeGreaterThan(0);
    expect(en.awards.toastTitle.length).toBeGreaterThan(0);
    expect(ru.awards.emptyMessage.length).toBeGreaterThan(0);
  });

  it('maps each server type to its title and hint', () => {
    expect(getAwardCopy('zone_first')).toEqual({
      title: ru.awards.zoneFirst,
      hint: ru.awards.zoneFirstHint,
    });
    expect(getAwardCopy('zone_revival')).toEqual({
      title: ru.awards.zoneRevival,
      hint: ru.awards.zoneRevivalHint,
    });
    expect(getAwardCopy('hive_ignited')).toEqual({
      title: ru.awards.hiveIgnited,
      hint: ru.awards.hiveIgnitedHint,
    });
    expect(getAwardCopy('hive_founder')).toEqual({
      title: ru.awards.hiveFounder,
      hint: ru.awards.hiveFounderHint,
    });
  });

  it('falls back for an unknown type without a hint', () => {
    expect(getAwardCopy('future_badge')).toEqual({
      title: ru.awards.unknown,
      hint: null,
    });
  });
});

describe('award toast', () => {
  beforeEach(() => {
    showInfoToast.mockReset();
  });

  it('stays silent when the publish response has no awards', () => {
    expect(formatAwardToastMessage([])).toBeNull();
    announceAwards([]);
    expect(showInfoToast).not.toHaveBeenCalled();
  });

  it('announces a single award with its hint', () => {
    announceAwards([{ type: 'zone_first' }]);

    expect(showInfoToast).toHaveBeenCalledOnce();
    expect(showInfoToast).toHaveBeenCalledWith({
      title: ru.awards.toastTitle,
      message: `${ru.awards.zoneFirst} — ${ru.awards.zoneFirstHint}`,
    });
  });

  it('keeps every award from one publish in a single toast', () => {
    const message = formatAwardToastMessage([{ type: 'zone_revival' }, { type: 'hive_ignited' }]);

    expect(message).toBe(
      `${ru.awards.zoneRevival} — ${ru.awards.zoneRevivalHint}\n${ru.awards.hiveIgnited} — ${ru.awards.hiveIgnitedHint}`,
    );
  });

  it('omits the hint for an unknown award', () => {
    expect(formatAwardToastMessage([{ type: 'future_badge' }])).toBe(ru.awards.unknown);
  });
});

describe('awards pagination', () => {
  it('stops when the server sends a null cursor', () => {
    expect(nextAwardsPageParam(null)).toBeUndefined();
  });

  it('keeps a non-null cursor, including an empty string', () => {
    expect(nextAwardsPageParam('cursor-2')).toBe('cursor-2');
    expect(nextAwardsPageParam('')).toBe('');
  });
});
