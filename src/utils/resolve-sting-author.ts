import type { Sting, User } from '@/src/types';

type CurrentUser = Pick<User, 'id' | 'username' | 'avatarUrl'> | null;

export function resolveStingAuthor(sting: Sting, currentUser: CurrentUser) {
  const isOwnSting = currentUser?.id === sting.authorId;

  return {
    username: sting.authorUsername ?? (isOwnSting ? (currentUser?.username ?? 'User') : 'User'),
    avatarUrl: sting.authorAvatarUrl ?? (isOwnSting ? (currentUser?.avatarUrl ?? null) : null),
  };
}
