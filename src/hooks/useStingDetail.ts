import { useQuery } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';

export function useStingDetail(stingId: string | null) {
  return useQuery({
    queryKey: ['sting', stingId],
    queryFn: () => stingsApi.getById(stingId!),
    enabled: stingId !== null,
  });
}
