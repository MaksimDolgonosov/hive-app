import { useQuery } from '@tanstack/react-query';

import * as safetyApi from '@/src/api/safety';
import { useAuthStore } from '@/src/stores/authStore';
import { blockedUsersQueryKey } from '@/src/utils/blocked-users-cache';

export function useBlockedUsers() {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: blockedUsersQueryKey,
    queryFn: () => safetyApi.listBlockedUsers(),
    enabled: status === 'authenticated',
  });
}
