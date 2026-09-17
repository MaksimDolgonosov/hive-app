import AsyncStorage from '@react-native-async-storage/async-storage';

const INVITE_CODE_KEY = '@hive/pendingInviteCode';
const INVITE_SAVED_AT_KEY = '@hive/pendingInviteSavedAt';
const INVITE_TTL_MS = 7 * 24 * 60 * 60_000;

export async function loadPendingInviteCode(): Promise<string | null> {
  const [code, savedAtRaw] = await Promise.all([
    AsyncStorage.getItem(INVITE_CODE_KEY),
    AsyncStorage.getItem(INVITE_SAVED_AT_KEY),
  ]);

  if (!code) {
    return null;
  }

  const savedAt = savedAtRaw ? Number(savedAtRaw) : 0;
  if (!Number.isFinite(savedAt) || Date.now() - savedAt > INVITE_TTL_MS) {
    await clearPendingInviteCode();
    return null;
  }

  return code;
}

export async function savePendingInviteCode(code: string): Promise<void> {
  const trimmed = code.trim();
  if (!trimmed) {
    return;
  }

  await Promise.all([
    AsyncStorage.setItem(INVITE_CODE_KEY, trimmed),
    AsyncStorage.setItem(INVITE_SAVED_AT_KEY, String(Date.now())),
  ]);
}

export async function clearPendingInviteCode(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(INVITE_CODE_KEY),
    AsyncStorage.removeItem(INVITE_SAVED_AT_KEY),
  ]);
}
