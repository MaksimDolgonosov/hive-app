import { useQuery } from '@tanstack/react-query';

import * as usersApi from '@/src/api/users';

export function usePublicProfile(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId, 'public'],
    queryFn: () => usersApi.getPublicProfile(userId!),
    enabled: userId !== null,
  });
}
