import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { PublishStingInput } from '@/src/api/stings';
import { useMapStore } from '@/src/stores/mapStore';
import type { StingsNearbyResponse } from '@/src/types';

function upsertPublishedSting(
  queryClient: ReturnType<typeof useQueryClient>,
  sting: StingsNearbyResponse['stings'][number],
) {
  queryClient.setQueriesData<StingsNearbyResponse>({ queryKey: ['stings'] }, (cached) => {
    if (!cached) {
      return cached;
    }

    if (sting.hiveId) {
      return {
        ...cached,
        stings: cached.stings.filter((item) => item.id !== sting.id),
      };
    }

    if (cached.stings.some((item) => item.id === sting.id)) {
      return cached;
    }

    return {
      ...cached,
      stings: [sting, ...cached.stings],
    };
  });
}

export function usePublishSting() {
  const queryClient = useQueryClient();
  const requestMapFocus = useMapStore((state) => state.requestMapFocus);

  return useMutation({
    mutationFn: (input: PublishStingInput) => stingsApi.create(input),
    onSuccess: (response) => {
      const { sting } = response;

      upsertPublishedSting(queryClient, sting);
      requestMapFocus({
        lat: sting.location.lat,
        lng: sting.location.lng,
        stingId: sting.hiveId ? null : sting.id,
        hiveId: sting.hiveId,
      });

      void queryClient.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
    },
  });
}
