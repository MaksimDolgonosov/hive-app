import i18n from '@/src/i18n';
import { showInfoToast } from '@/src/stores/toastStore';
import type { AwardType } from '@/src/types';

type AwardCopy = { title: string; hint: string | null };

/** `null` с сервера означает конец списка; пустую строку курсором не считаем концом. */
export function nextAwardsPageParam(nextCursor: string | null): string | undefined {
  return nextCursor ?? undefined;
}

type AwardAnnouncement = { type: AwardType | string };

/** Неизвестный тип награды не должен ломать рендер — отдаём нейтральный ключ. */
export function getAwardCopy(type: AwardType | string): AwardCopy {
  switch (type) {
    case 'zone_first':
      return { title: i18n.t('awards.zoneFirst'), hint: i18n.t('awards.zoneFirstHint') };
    case 'zone_revival':
      return { title: i18n.t('awards.zoneRevival'), hint: i18n.t('awards.zoneRevivalHint') };
    case 'hive_ignited':
      return { title: i18n.t('awards.hiveIgnited'), hint: i18n.t('awards.hiveIgnitedHint') };
    case 'hive_founder':
      return { title: i18n.t('awards.hiveFounder'), hint: i18n.t('awards.hiveFounderHint') };
    default:
      return { title: i18n.t('awards.unknown'), hint: null };
  }
}

/** Одна строка тоста на награду: публикация может вернуть несколько сразу (§G5, §G13). */
export function formatAwardToastMessage(awards: readonly AwardAnnouncement[]): string | null {
  if (awards.length === 0) {
    return null;
  }

  return awards
    .map((award) => {
      const copy = getAwardCopy(award.type);
      return copy.hint ? `${copy.title} — ${copy.hint}` : copy.title;
    })
    .join('\n');
}

/** Поздравление за награды первооткрывателя и зажигания улья (§G5, §G13). */
export function announceAwards(awards: readonly AwardAnnouncement[]): void {
  const message = formatAwardToastMessage(awards);

  if (!message) {
    return;
  }

  showInfoToast({
    title: i18n.t('awards.toastTitle'),
    message,
  });
}
