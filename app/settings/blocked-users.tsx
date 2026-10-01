import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { getProfileInitials } from '@/src/components/profile/ProfileAvatar';
import { ProfileCollectionLayout } from '@/src/components/profile/ProfileCollectionLayout';
import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useBlockedUsers } from '@/src/hooks/useBlockedUsers';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { useSafetyReport } from '@/src/hooks/useSafetyReport';
import { useAuthStore } from '@/src/stores/authStore';
import { buildAvatarDisplayUri } from '@/src/utils/avatar-url';
import { goBackOrReplace } from '@/src/utils/auth-navigation';

const AVATAR_SIZE = 40;

export default function BlockedUsersScreen() {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const blocked = useBlockedUsers();
  const safety = useSafetyReport();
  const avatarCacheVersion = useAuthStore((state) => state.avatarCacheVersion);
  const users = blocked.data?.users ?? [];

  return (
    <ProfileCollectionLayout
      title={t('safety.blockedListTitle')}
      onBack={() => goBackOrReplace('/settings')}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 32,
          flexGrow: users.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
      >
        {blocked.isLoading ? (
          <View className="flex-1 items-center justify-center py-16">
            <HiveLoader size={72} />
          </View>
        ) : blocked.isError ? (
          <View className="flex-1 items-center justify-center gap-4 py-16">
            <Text className="text-center font-inter text-base text-hive-foreground">
              {t('safety.failed')}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => void blocked.refetch()}>
              <Text className="font-inter text-base font-bold text-hive-primary">
                {t('nearby.retry')}
              </Text>
            </Pressable>
          </View>
        ) : users.length === 0 ? (
          <View className="flex-1 items-center justify-center py-16">
            <Text className="text-center font-inter text-base text-hive-muted">
              {t('safety.blockedListEmpty')}
            </Text>
          </View>
        ) : (
          users.map((user, index) => {
            const uri = user.avatarUrl
              ? buildAvatarDisplayUri(user.avatarUrl, avatarCacheVersion)
              : null;

            return (
              <View
                key={user.id}
                className="flex-row items-center gap-3 py-3"
                style={{
                  borderBottomWidth: index === users.length - 1 ? 0 : 1,
                  borderBottomColor: theme.stroke,
                }}
              >
                {uri ? (
                  <Image
                    accessibilityLabel={user.username}
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    source={{ uri }}
                    style={{
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      borderRadius: AVATAR_SIZE / 2,
                    }}
                  />
                ) : (
                  <View
                    className="items-center justify-center rounded-full bg-hive-primary"
                    style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                  >
                    <Text className="font-inter text-xs font-bold text-hive-on-accent">
                      {getProfileInitials(user.username) || '?'}
                    </Text>
                  </View>
                )}
                <Text
                  className="flex-1 font-inter text-base text-hive-foreground"
                  numberOfLines={1}
                >
                  {user.username}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={safety.hiding}
                  onPress={() => void safety.unhideUser(user.id)}
                >
                  <Text className="font-inter text-sm font-semibold text-hive-primary">
                    {t('safety.unhide')}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </ProfileCollectionLayout>
  );
}
