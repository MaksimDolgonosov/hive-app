import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { Sting } from '@/src/types';

export function useStingReaction(stingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => stingsApi.react(stingId),
    onSuccess: ({ reactionsCount }) => {
      queryClient.setQueryData<{ sting: Sting }>(['sting', stingId], (cached) => {
        if (!cached) {
          return cached;
        }

        return {
          sting: {
            ...cached.sting,
            reactionsCount,
          },
        };
      });

      void queryClient.invalidateQueries({ queryKey: ['stings'] });
      void queryClient.invalidateQueries({ queryKey: ['hive'] });
    },
  });
}
