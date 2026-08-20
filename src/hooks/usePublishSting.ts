import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { PublishStingInput } from '@/src/api/stings';
import { useAuthStore } from '@/src/stores/authStore';
import { useMapStore } from '@/src/stores/mapStore';
import type { Sting } from '@/src/types';
import { upsertStingInNearbyQueries } from '@/src/utils/stings-query-cache';

function enrichStingWithAuthor(sting: Sting): Sting {
  const user = useAuthStore.getState().user;
  if (!user || user.id !== sting.authorId) {
    return sting;
  }

  return {
    ...sting,
    authorUsername: sting.authorUsername ?? user.username,
    authorAvatarUrl: sting.authorAvatarUrl ?? user.avatarUrl ?? null,
  };
}

export function usePublishSting() {
  const queryClient = useQueryClient();
  const requestMapFocus = useMapStore((state) => state.requestMapFocus);

  return useMutation({
    mutationFn: (input: PublishStingInput) => stingsApi.create(input),
    onSuccess: (response) => {
      const sting = enrichStingWithAuthor(response.sting);

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
