export function formatAppleFullName(
  fullName: { givenName?: string | null; familyName?: string | null } | null | undefined,
): string | null {
  if (!fullName) {
    return null;
  }

  const name = [fullName.givenName, fullName.familyName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ');

  return name || null;
}

export function isAppleCancel(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ERR_REQUEST_CANCELED'
  );
}
