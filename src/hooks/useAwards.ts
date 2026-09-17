import { useInfiniteQuery } from '@tanstack/react-query';

import * as awardsApi from '@/src/api/awards';

const PAGE_SIZE = 20;

export function useAwards() {
  return useInfiniteQuery({
    queryKey: ['awards'],
    queryFn: ({ pageParam }) => awardsApi.getMine({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
