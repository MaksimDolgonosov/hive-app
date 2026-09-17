import i18n from '@/src/i18n';

const SEC_PER_HOUR = 3600;
const SEC_PER_DAY = 86_400;

/**
 * Человекочитаемая длительность TTL: «24 ч» / «3 дн» (§G1).
 *
 * Отдельная функция, а не набор ключей на каждый случай: числа подставляются
 * интерполяцией, а предложения вокруг собираются из `{{ttl}}`.
 */
export function formatTtl(ttlSec: number): string {
  if (ttlSec >= SEC_PER_DAY) {
    return i18n.t('sting.ttlDays', { count: Math.round(ttlSec / SEC_PER_DAY) });
  }

  return i18n.t('sting.ttlHours', { count: Math.max(1, Math.round(ttlSec / SEC_PER_HOUR)) });
}
