export function contactPhone(value: string): string | null | undefined {
  const raw = value.trim().replace(/[\s()-]/g, '');
  if (!raw) {
    return null;
  }

  const normalized = /^8\d{10}$/.test(raw)
    ? `+7${raw.slice(1)}`
    : /^7\d{10}$/.test(raw)
      ? `+${raw}`
      : /^\d{10}$/.test(raw)
        ? `+7${raw}`
        : raw;

  return /^\+[1-9]\d{6,14}$/.test(normalized) ? normalized : undefined;
}
