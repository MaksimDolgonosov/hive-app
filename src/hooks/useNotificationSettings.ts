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

function mergeSettings(
  current: NotificationSettings | undefined,
  patch: Partial<NotificationSettings>,
): NotificationSettings {
  return { ...(current ?? DEFAULT_SETTINGS), ...patch };
}

export function useNotificationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationsApi.getSettings(),
    staleTime: 5 * 60_000,
    placeholderData: DEFAULT_SETTINGS,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) => notificationsApi.updateSettings(patch),
    scope: { id: 'notification-settings' },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationSettings>(QUERY_KEY);
      queryClient.setQueryData<NotificationSettings>(QUERY_KEY, mergeSettings(previous, patch));
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSuccess: (settings) => {
      queryClient.setQueryData<NotificationSettings>(QUERY_KEY, (current) =>
        mergeSettings(current, settings),
      );
    },
  });

  function update(patch: Partial<NotificationSettings>) {
    const current = queryClient.getQueryData<NotificationSettings>(QUERY_KEY) ?? DEFAULT_SETTINGS;
    const hasChange = (Object.keys(patch) as (keyof NotificationSettings)[]).some(
      (key) => patch[key] !== current[key],
    );

    if (!hasChange || mutation.isPending) {
      return;
    }

    mutation.mutate(patch);
  }

  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    isLoading: query.isLoading,
    update,
  };
}
