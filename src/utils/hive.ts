import type { Hive, HiveStage } from '@/src/types';

/** Минимум activationCount для активации улья — совпадает с HIVE_ACTIVATION_THRESHOLD на backend. */
export const HIVE_ACTIVATION_THRESHOLD = 3;

/** Максимальный вклад одного автора в activationCount (§G13). Держится в синхроне с backend. */
export const HIVE_AUTHOR_WEIGHT_CAP = 2;

type HiveStageInput = Pick<Hive, 'stage' | 'activationCount' | 'activeStingsCount'>;

/**
 * Единственный источник стадии на клиенте (§G13).
 * Приоритет — поле `stage` с сервера; для старого backend без него стадия
 * выводится из счётчиков, чтобы поведение не менялось до появления контракта.
 */
export function resolveHiveStage(hive: HiveStageInput): HiveStage {
  if (hive.stage === 'seed' || hive.stage === 'hive') {
    return hive.stage;
  }

  // Неизвестное значение стадии трактуем как улей: лучше показать кластер, чем потерять.
  if (hive.stage != null) {
    return 'hive';
  }

  const count = hive.activationCount ?? hive.activeStingsCount;
  return count >= HIVE_ACTIVATION_THRESHOLD ? 'hive' : 'seed';
}

export function isActiveHive(hive: HiveStageInput): boolean {
  return resolveHiveStage(hive) === 'hive';
}

export function isSeedHive(hive: HiveStageInput): boolean {
  return resolveHiveStage(hive) === 'seed';
}
