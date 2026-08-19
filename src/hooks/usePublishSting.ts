import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { PublishStingInput } from '@/src/api/stings';
import { useMapStore } from '@/src/stores/mapStore';
import { upsertStingInNearbyQueries } from '@/src/utils/stings-query-cache';

export function usePublishSting() {
  const queryClient = useQueryClient();
  const requestMapFocus = useMapStore((state) => state.requestMapFocus);

  return useMutation({
    mutationFn: (input: PublishStingInput) => stingsApi.create(input),
    onSuccess: (response) => {
      const { sting } = response;

      upsertStingInNearbyQueries(queryClient, sting);
      requestMapFocus({
        lat: sting.location.lat,
        lng: sting.location.lng,
        stingId: sting.hiveId ? null : sting.id,
        hiveId: sting.hiveId,
      });

      void queryClient.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
      void queryClient.invalidateQueries({ queryKey: ['profile', 'overview'] });
    },
  });
}
