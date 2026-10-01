import type { QueryClient } from '@tanstack/react-query';

import { queryClient } from '@/src/lib/query-client';
import { EMPTY_SOCIAL_LINKS, type BlockedUserSummary, type PublicUserProfile } from '@/src/types';

export const blockedUsersQueryKey = ['users', 'blocks'] as const;

type BlockedUsersCache = {
  users: BlockedUserSummary[];
};

export function blockedAuthorIds(client: QueryClient = queryClient): Set<string> {
  const data = client.getQueryData<BlockedUsersCache>(blockedUsersQueryKey);
  return new Set(data?.users.map((user) => user.id) ?? []);
}

export function rememberBlockedUser(
  user: Pick<BlockedUserSummary, 'id' | 'username' | 'avatarUrl'>,
  client: QueryClient = queryClient,
): void {
  client.setQueryData<BlockedUsersCache>(blockedUsersQueryKey, (current) => {
    const users = current?.users ?? [];
    if (users.some((item) => item.id === user.id)) {
      return current ?? { users };
    }

    return {
      users: [
        {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          blockedAt: new Date().toISOString(),
        },
        ...users,
      ],
    };
  });

  client.setQueryData<PublicUserProfile>(['user', user.id, 'public'], (current) => {
    if (!current) {
      return current;
    }

    return {
      ...current,
      blockedByViewer: true,
      recentPhotos: [],
      stats: { photos: 0, hives: 0, likes: 0, awards: 0 },
      user: {
        ...current.user,
        bio: null,
        socialLinks: EMPTY_SOCIAL_LINKS,
      },
    };
  });
}

export function forgetBlockedUser(userId: string, client: QueryClient = queryClient): void {
  client.setQueryData<BlockedUsersCache>(blockedUsersQueryKey, (current) => {
    if (!current) {
      return current;
    }

    return { users: current.users.filter((user) => user.id !== userId) };
  });
}

export function invalidateSafetySurfaces(client: QueryClient, userId?: string): void {
  void client.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
  void client.invalidateQueries({ queryKey: ['hive'] });
  if (userId) {
    void client.invalidateQueries({ queryKey: ['user', userId, 'public'] });
  }
}
