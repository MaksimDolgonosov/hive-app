import { router, type Href } from 'expo-router';

export function openUserProfile(userId: string, currentUserId?: string | null) {
  if (currentUserId && userId === currentUserId) {
    router.push('/(tabs)/profile' as Href);
    return;
  }

  router.push(`/(modals)/user/${userId}` as Href);
}
