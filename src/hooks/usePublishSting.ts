import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as stingsApi from '@/src/api/stings';
import type { PublishStingInput } from '@/src/api/stings';
import i18n from '@/src/i18n';
import { useAuthStore } from '@/src/stores/authStore';
import { useMapStore } from '@/src/stores/mapStore';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import { showInfoToast } from '@/src/stores/toastStore';
import type { Award, Sting } from '@/src/types';
import { trackEvent } from '@/src/utils/analytics-queue';
import { getAwardCopy } from '@/src/utils/awards';
import { upsertStingInNearbyQueries } from '@/src/utils/stings-query-cache';

function enrichStingWithAuthor(sting: Sting): Sting {
  const user = useAuthStore.getState().user;
  if (!user || user.id !== sting.authorId) {
    return sting;
  }

  return {
    ...sting,
    authorUsername: sting.authorUsername ?? user.username,
    authorAvatarUrl: sting.authorAvatarUrl ?? user.avatarUrl ?? null,
  };
}

/** Поздравление за награды первооткрывателя и зажигания улья (§G5, §G13). */
function announceAwards(awards: Award[]): void {
  if (awards.length === 0) {
    return;
  }

  const copy = getAwardCopy(awards[0].type);

  showInfoToast({
    title: i18n.t('awards.toastTitle'),
    message: copy.hint ? `${copy.title} — ${copy.hint}` : copy.title,
  });
}

export function usePublishSting() {
  const queryClient = useQueryClient();
  const requestMapFocus = useMapStore((state) => state.requestMapFocus);
  const hasPublishedFirstSting = usePreferencesStore((state) => state.hasPublishedFirstSting);
  const setHasPublishedFirstSting = usePreferencesStore((state) => state.setHasPublishedFirstSting);

  return useMutation({
    mutationFn: (input: PublishStingInput) => stingsApi.create(input),
    onSuccess: (response) => {
      const sting = enrichStingWithAuthor(response.sting);

      upsertStingInNearbyQueries(queryClient, sting);
      requestMapFocus({
        lat: sting.location.lat,
        lng: sting.location.lng,
        stingId: sting.hiveId ? null : sting.id,
        hiveId: sting.hiveId,
      });

      announceAwards(response.awards ?? []);

      trackEvent(hasPublishedFirstSting ? 'sting_published' : 'first_sting_published', {
        zoneId: response.zone?.id,
        props: { ttlSec: response.ttlSec ?? null, awards: response.awards?.length ?? 0 },
      });

      if (!hasPublishedFirstSting) {
        void setHasPublishedFirstSting(true);
        usePreferencesStore.getState().setPendingPushExplain(true);
      }

      void queryClient.invalidateQueries({ queryKey: ['stings'], refetchType: 'all' });
      void queryClient.invalidateQueries({ queryKey: ['profile', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['profile', 'my-stings'] });
      void queryClient.invalidateQueries({ queryKey: ['profile', 'my-hives'] });
      void queryClient.invalidateQueries({ queryKey: ['awards'] });
    },
  });
}
