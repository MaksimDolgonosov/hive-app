import { useInfiniteQuery } from '@tanstack/react-query';

import * as awardsApi from '@/src/api/awards';
import { nextAwardsPageParam } from '@/src/utils/awards';

const PAGE_SIZE = 20;

export function useAwards() {
  return useInfiniteQuery({
    queryKey: ['awards'],
    queryFn: ({ pageParam }) => awardsApi.getMine({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => nextAwardsPageParam(lastPage.nextCursor),
  });
}
