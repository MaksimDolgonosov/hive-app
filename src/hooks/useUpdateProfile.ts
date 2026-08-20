import { useMutation } from '@tanstack/react-query';

import * as authApi from '@/src/api/auth';
import { useAuthStore } from '@/src/stores/authStore';
import type { UpdateProfileInput } from '@/src/types';

export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => authApi.updateProfile(input),
    onSuccess: ({ user }) => {
      setUser(user);
    },
  });
}
