import type { Invite } from '@/src/types';

export const INVITE_CODE_LENGTH = 8;

const INVITE_LINK_CODE = /\/i\/([^/?#\s]+)/i;

/** Код base32 из 8 символов (§G8): пробелы, дефисы и регистр при вводе не важны, ссылка `/i/{code}` тоже. */
export function normalizeInviteCode(raw: string): string {
  const fromLink = raw.match(INVITE_LINK_CODE)?.[1];

  return (fromLink ?? raw)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH);
}

export function isCompleteInviteCode(code: string): boolean {
  return code.length === INVITE_CODE_LENGTH;
}

/** Сервер может вернуть истёкшие и исчерпанные коды — их показывать как активные нельзя. */
export function pickActiveInvite(invites: readonly Invite[], now = Date.now()): Invite | null {
  return (
    invites.find(
      (invite) => Date.parse(invite.expiresAt) > now && invite.usesCount < invite.usesLimit,
    ) ?? null
  );
}
