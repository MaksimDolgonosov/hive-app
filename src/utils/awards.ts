import i18n from '@/src/i18n';
import type { AwardType } from '@/src/types';

type AwardCopy = { title: string; hint: string | null };

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
