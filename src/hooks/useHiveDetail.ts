import { useQuery } from '@tanstack/react-query';

import * as hivesApi from '@/src/api/hives';

export function useHiveDetail(hiveId: string | null) {
  return useQuery({
    queryKey: ['hive', hiveId],
    queryFn: () => hivesApi.getById(hiveId!),
    enabled: hiveId !== null,
  });
}
