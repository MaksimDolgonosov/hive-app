import { router, type Href } from 'expo-router';

export function openHive(hiveId: string) {
  router.push(`/(modals)/hive/${hiveId}` as Href);
}
