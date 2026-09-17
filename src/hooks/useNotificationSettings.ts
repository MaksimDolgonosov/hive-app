import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as notificationsApi from '@/src/api/notifications';
import type { NotificationSettings } from '@/src/types';

const QUERY_KEY = ['notification-settings'] as const;

const DEFAULT_SETTINGS: NotificationSettings = {
  reactions: true,
  nearbyActivity: true,
  campaigns: true,
  expiringSting: false,
  inviteAccepted: true,
};

export function useNotificationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationsApi.getSettings(),
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) => notificationsApi.updateSettings(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationSettings>(QUERY_KEY);
      queryClient.setQueryData<NotificationSettings>(QUERY_KEY, {
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
  };
}
