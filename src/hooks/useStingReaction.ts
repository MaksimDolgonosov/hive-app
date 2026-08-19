import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { Sting } from '@/src/types';
import { updateStingReactionState } from '@/src/utils/stings-query-cache';

type StingDetailCache = { sting: Sting };

function toggleLikeState(sting: Sting): Sting {
  const wasLiked = sting.hasLiked ?? false;

  return {
    ...sting,
    hasLiked: !wasLiked,
    reactionsCount: Math.max(0, sting.reactionsCount + (wasLiked ? -1 : 1)),
  };
}

export function useStingReaction(stingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => stingsApi.react(stingId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['sting', stingId] });

      const previous = queryClient.getQueryData<StingDetailCache>(['sting', stingId]);

      if (previous?.sting) {
        queryClient.setQueryData<StingDetailCache>(['sting', stingId], {
          sting: toggleLikeState(previous.sting),
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['sting', stingId], context.previous);
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData<StingDetailCache>(['sting', stingId], (cached) => {
        if (!cached) {
          return cached;
        }

        return {
          sting: {
            ...cached.sting,
            reactionsCount: response.reactionsCount,
            hasLiked: response.hasLiked,
          },
        };
      });

      updateStingReactionState(queryClient, stingId, {
        reactionsCount: response.reactionsCount,
        hasLiked: response.hasLiked,
      });
    },
  });
}
