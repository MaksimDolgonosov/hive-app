import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as invitesApi from '@/src/api/invites';
import { getApiErrorCode, getApiErrorRetryAfterSec } from '@/src/utils/api-error';
import { trackEvent } from '@/src/utils/analytics-queue';

export function useMyInvites() {
  return useQuery({
    queryKey: ['invites', 'me'],
    queryFn: () => invitesApi.getMine(),
  });
}

export function usePublicInvite(code: string | null) {
  return useQuery({
    queryKey: ['invites', 'public', code],
    queryFn: () => invitesApi.getPublic(code!),
    enabled: Boolean(code),
    retry: false,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => invitesApi.create(),
    onSuccess: () => {
      trackEvent('invite_created');
      void queryClient.invalidateQueries({ queryKey: ['invites', 'me'] });
    },
    onError: (error) => {
      if (getApiErrorCode(error) === 'RATE_LIMITED') {
        getApiErrorRetryAfterSec(error);
      }
    },
  });
}
