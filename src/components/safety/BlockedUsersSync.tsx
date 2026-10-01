import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useBlockedUsers } from '@/src/hooks/useBlockedUsers';
import { useAuthStore } from '@/src/stores/authStore';
import { blockedUsersQueryKey } from '@/src/utils/blocked-users-cache';

/** Держит список скрытых в кэше, чтобы WebSocket не возвращал их пины. */
export function BlockedUsersSync() {
  const status = useAuthStore((state) => state.status);
  const queryClient = useQueryClient();
  useBlockedUsers();

  useEffect(() => {
    if (status === 'authenticated') {
      return;
    }

    queryClient.removeQueries({ queryKey: blockedUsersQueryKey });
  }, [queryClient, status]);

  return null;
}
