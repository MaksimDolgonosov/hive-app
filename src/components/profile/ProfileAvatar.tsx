import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { HiveLoader } from '@/src/components/ui/HiveLoader';

import { useAvatarUpload } from '@/src/hooks/useAvatarUpload';
import { useAuthStore } from '@/src/stores/authStore';
import { AvatarPermissionError, pickAvatarImage } from '@/src/utils/pick-avatar-image';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';
import { showApiErrorToast } from '@/src/utils/show-toast';

type ProfileAvatarProps = {
  username: string;
  avatarUrl: string | null;
  size?: number;
  editable?: boolean;
};

export function getProfileInitials(username: string): string {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function AvatarContent({
  username,
  avatarUrl,
  avatarCacheVersion,
  size,
}: {
  username: string;
  avatarUrl: string | null;
  avatarCacheVersion: number;
  size: number;
}) {
  const initials = getProfileInitials(username) || '?';
  const fontSize = Math.round(size * 0.35);
  const displayUri = avatarUrl ? buildAvatarDisplayUri(avatarUrl, avatarCacheVersion) : null;

  if (displayUri) {
    return (
      <View
        className="overflow-hidden rounded-full border-[3px] border-hive-surface"
        style={{ width: size, height: size }}
      >
        <Image
          key={displayUri}
          accessibilityLabel={username}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: displayUri }}
          style={{ width: size, height: size }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFB800',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text className="font-display font-bold text-hive-on-accent" style={{ fontSize }}>
        {initials}
      </Text>
    </View>
  );
}

export function ProfileAvatar({
  username,
  avatarUrl,
  size = 80,
  editable = false,
}: ProfileAvatarProps) {
  const { t } = useTranslation();
  const { uploadAvatar, removeAvatar, isBusy } = useAvatarUpload();
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);

  async function handlePick(source: 'camera' | 'library') {
    try {
      const uri = await pickAvatarImage(source);
      if (!uri) {
        return;
      }

      await uploadAvatar(uri);
    } catch (error) {
      if (error instanceof AvatarPermissionError) {
        Alert.alert(
          t('profile.avatarPermissionTitle'),
          error.source === 'camera'
            ? t('profile.avatarCameraPermissionMessage')
            : t('profile.avatarGalleryPermissionMessage'),
          [
            { text: t('profile.avatarCancel'), style: 'cancel' },
            {
              text: t('profile.avatarOpenSettings'),
              onPress: () => void Linking.openSettings(),
            },
          ],
        );
        return;
      }

      showApiErrorToast(error, {
        titleKey: 'profile.avatarUploadFailedTitle',
        fallbackKey: 'profile.avatarUploadFailedMessage',
      });
    }
  }

  async function handleRemove() {
    try {
      await removeAvatar();
    } catch (error) {
      showApiErrorToast(error, {
        titleKey: 'profile.avatarUploadFailedTitle',
        fallbackKey: 'profile.avatarUploadFailedMessage',
      });
    }
  }

  function showPickerOptions() {
    if (isBusy) {
      return;
    }

    Alert.alert(t('profile.avatarPickerTitle'), undefined, [
      {
        text: t('profile.avatarTakePhoto'),
        onPress: () => void handlePick('camera'),
      },
      {
        text: t('profile.avatarChooseGallery'),
        onPress: () => void handlePick('library'),
      },
      ...(avatarUrl
        ? [
            {
              text: t('profile.avatarRemove'),
              style: 'destructive' as const,
              onPress: () => void handleRemove(),
            },
          ]
        : []),
      { text: t('profile.avatarCancel'), style: 'cancel' },
    ]);
  }

  if (!editable) {
    return (
      <AvatarContent
        avatarCacheVersion={avatarCacheVersion}
        avatarUrl={avatarUrl}
        size={size}
        username={username}
      />
    );
  }

  const badgeSize = Math.max(24, Math.round(size * 0.3));

  return (
    <Pressable
      accessibilityHint={t('profile.avatarEditHint')}
      accessibilityLabel={t('profile.avatarEditLabel')}
      accessibilityRole="button"
      disabled={isBusy}
      onPress={showPickerOptions}
    >
      <View style={{ width: size, height: size }}>
        <AvatarContent
          avatarCacheVersion={avatarCacheVersion}
          avatarUrl={avatarUrl}
          size={size}
          username={username}
        />

        {isBusy ? (
          <View
            className="absolute inset-0 items-center justify-center rounded-full bg-black/45"
            style={{ borderRadius: size / 2 }}
          >
            <HiveLoader color="#FFFFFF" size="small" />
          </View>
        ) : null}

        <View
          className="absolute items-center justify-center rounded-full border-2 border-hive-bg bg-hive-primary"
          style={{
            width: badgeSize,
            height: badgeSize,
            right: -2,
            bottom: -2,
          }}
        >
          <Camera color="#0B0A08" size={Math.round(badgeSize * 0.5)} />
        </View>
      </View>
    </Pressable>
  );
}
