import type { QueryClient } from '@tanstack/react-query';

import type { Hive, HiveDetailResponse, Sting, StingsNearbyResponse } from '@/src/types';
import { isActiveHive } from '@/src/utils/hive';

export function upsertStingInNearbyQueries(queryClient: QueryClient, sting: Sting): void {
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

export function removeStingFromNearbyQueries(queryClient: QueryClient, stingId: string): void {
  queryClient.setQueriesData<StingsNearbyResponse>({ queryKey: ['stings'] }, (cached) => {
    if (!cached) {
      return cached;
    }

    return {
      ...cached,
      stings: cached.stings.filter((sting) => sting.id !== stingId),
    };
  });

  queryClient.setQueriesData<HiveDetailResponse>({ queryKey: ['hive'] }, (cached) => {
    if (!cached) {
      return cached;
    }

    return {
      ...cached,
      stings: cached.stings.filter((sting) => sting.id !== stingId),
    };
  });

  queryClient.removeQueries({ queryKey: ['sting', stingId] });
}

export function upsertHiveInNearbyQueries(queryClient: QueryClient, hive: Hive): void {
  queryClient.setQueriesData<StingsNearbyResponse>({ queryKey: ['stings'] }, (cached) => {
    if (!cached) {
      return cached;
    }

    const withoutHive = cached.hives.filter((item) => item.id !== hive.id);
    const hives = isActiveHive(hive.activeStingsCount) ? [...withoutHive, hive] : withoutHive;

    return {
      ...cached,
      hives,
    };
  });

  queryClient.setQueryData<HiveDetailResponse>(['hive', hive.id], (cached) => {
    if (!cached) {
      return cached;
    }

    return {
      ...cached,
      hive,
    };
  });
}

export function removeHiveFromNearbyQueries(queryClient: QueryClient, hiveId: string): void {
  queryClient.setQueriesData<StingsNearbyResponse>({ queryKey: ['stings'] }, (cached) => {
    if (!cached) {
      return cached;
    }

    return {
      ...cached,
      hives: cached.hives.filter((hive) => hive.id !== hiveId),
    };
  });

  queryClient.removeQueries({ queryKey: ['hive', hiveId] });
}

export function updateStingReactionState(
  queryClient: QueryClient,
  stingId: string,
  patch: { reactionsCount: number; hasLiked?: boolean },
): void {
  queryClient.setQueryData<{ sting: Sting }>(['sting', stingId], (cached) => {
    if (!cached) {
      return cached;
    }

    return {
      sting: {
        ...cached.sting,
        reactionsCount: patch.reactionsCount,
        ...(patch.hasLiked !== undefined ? { hasLiked: patch.hasLiked } : {}),
      },
    };
  });

  queryClient.setQueriesData<StingsNearbyResponse>({ queryKey: ['stings'] }, (cached) => {
    if (!cached) {
      return cached;
    }

    return {
      ...cached,
      stings: cached.stings.map((sting) =>
        sting.id === stingId
          ? {
              ...sting,
              reactionsCount: patch.reactionsCount,
              ...(patch.hasLiked !== undefined ? { hasLiked: patch.hasLiked } : {}),
            }
          : sting,
      ),
    };
  });

  queryClient.setQueriesData<HiveDetailResponse>({ queryKey: ['hive'] }, (cached) => {
    if (!cached) {
      return cached;
    }

    return {
      ...cached,
      stings: cached.stings.map((sting) =>
        sting.id === stingId
          ? {
              ...sting,
              reactionsCount: patch.reactionsCount,
              ...(patch.hasLiked !== undefined ? { hasLiked: patch.hasLiked } : {}),
            }
          : sting,
      ),
    };
  });
}

/** Обновляет только списки — не трогает кэш детальной карточки (там toggle-like). */
export function updateStingReactionCountInLists(
  queryClient: QueryClient,
  stingId: string,
  reactionsCount: number,
): void {
  queryClient.setQueriesData<StingsNearbyResponse>({ queryKey: ['stings'] }, (cached) => {
    if (!cached) {
      return cached;
    }

    return {
      ...cached,
      stings: cached.stings.map((sting) =>
        sting.id === stingId ? { ...sting, reactionsCount } : sting,
      ),
    };
  });

  queryClient.setQueriesData<HiveDetailResponse>({ queryKey: ['hive'] }, (cached) => {
    if (!cached) {
      return cached;
    }

    return {
      ...cached,
      stings: cached.stings.map((sting) =>
        sting.id === stingId ? { ...sting, reactionsCount } : sting,
      ),
    };
  });
}
