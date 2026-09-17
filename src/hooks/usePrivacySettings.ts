import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as profileApi from '@/src/api/profile';
import type { UserPrivacySettings } from '@/src/types';

const QUERY_KEY = ['privacy-settings'] as const;

const DEFAULT_SETTINGS: UserPrivacySettings = {
  allowEcho: true,
  allowSharing: true,
};

export function usePrivacySettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => profileApi.getPrivacySettings(),
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<UserPrivacySettings>) => profileApi.updatePrivacySettings(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<UserPrivacySettings>(QUERY_KEY);
      queryClient.setQueryData<UserPrivacySettings>(QUERY_KEY, {
        ...(previous ?? DEFAULT_SETTINGS),
        ...patch,
      });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(QUERY_KEY, settings);
    },
  });

  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    isLoading: query.isLoading,
    update: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
