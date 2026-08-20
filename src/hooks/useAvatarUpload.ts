import { useMutation } from '@tanstack/react-query';

import * as authApi from '@/src/api/auth';
import { useAuthStore } from '@/src/stores/authStore';

export function useAvatarUpload() {
  const setUser = useAuthStore((state) => state.setUser);
  const bumpAvatarCacheVersion = useAuthStore((state) => state.bumpAvatarCacheVersion);

  const uploadMutation = useMutation({
    mutationFn: (photoUri: string) => authApi.uploadAvatar(photoUri),
    onSuccess: ({ user }) => {
      setUser(user);
      bumpAvatarCacheVersion();
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => authApi.removeAvatar(),
    onSuccess: ({ user }) => {
      setUser(user);
      bumpAvatarCacheVersion();
    },
  });

  return {
    uploadAvatar: uploadMutation.mutateAsync,
    removeAvatar: removeMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isRemoving: removeMutation.isPending,
    isBusy: uploadMutation.isPending || removeMutation.isPending,
  };
}
