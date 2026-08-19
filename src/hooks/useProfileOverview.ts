import { useQuery } from '@tanstack/react-query';

import * as authApi from '@/src/api/auth';

export function useProfileOverview(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'overview'],
    queryFn: () => authApi.getProfileOverview(),
    enabled,
  });
}
