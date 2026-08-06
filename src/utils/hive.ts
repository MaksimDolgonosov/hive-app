/** Минимум жал для отображения ulя — совпадает с HIVE_ACTIVATION_THRESHOLD на backend. */
export const HIVE_ACTIVATION_THRESHOLD = 3;

export function isActiveHive(activeStingsCount: number): boolean {
  return activeStingsCount >= HIVE_ACTIVATION_THRESHOLD;
}
