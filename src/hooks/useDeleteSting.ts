import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import { removeStingFromNearbyQueries } from '@/src/utils/stings-query-cache';

export function useDeleteSting(stingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => stingsApi.remove(stingId),
    onSuccess: () => {
      removeStingFromNearbyQueries(queryClient, stingId);
      void queryClient.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
      void queryClient.invalidateQueries({ queryKey: ['profile', 'overview'] });
    },
  });
}
