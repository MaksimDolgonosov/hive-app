import { useInfiniteQuery } from '@tanstack/react-query';

import * as profileApi from '@/src/api/profile';

const PAGE_SIZE = 20;

export function useMyStings() {
  return useInfiniteQuery({
    queryKey: ['profile', 'my-stings'],
    queryFn: ({ pageParam }) => profileApi.getMyStings({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useMyHives() {
  return useInfiniteQuery({
    queryKey: ['profile', 'my-hives'],
    queryFn: ({ pageParam }) => profileApi.getMyHives({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useLikedStings() {
  return useInfiniteQuery({
    queryKey: ['profile', 'liked-stings'],
    queryFn: ({ pageParam }) => profileApi.getLikedStings({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
