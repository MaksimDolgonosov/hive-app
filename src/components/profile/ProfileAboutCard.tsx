import { Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Text, View } from 'react-native';

import { SocialLinkIcon } from '@/src/components/profile/SocialLinkIcon';
import { SOCIAL_LINK_META } from '@/src/constants/social-links';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { usePreferencesStore } from '@/src/stores/preferencesStore';
import type { User } from '@/src/types';
import {
  getActiveSocialLinks,
  hasAnySocialLink,
  normalizeUserSocialLinks,
  withInstagramVisibility,
} from '@/src/utils/social-links';

import { ProfileGlassCard } from './ProfileGlassCard';

type ProfileAboutCardProps = {
  user: User;
  onEdit?: () => void;
  emptyBioKey?: string;
  emptySocialKey?: string;
};

export function ProfileAboutCard({
  user,
  onEdit,
  emptyBioKey = 'profile.aboutEmpty',
  emptySocialKey = 'profile.socialEmpty',
}: ProfileAboutCardProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const instagramLinksAllowed = usePreferencesStore((state) => state.instagramLinksAllowed);
  const bio = user.bio?.trim() ?? '';
  const socialLinks = withInstagramVisibility(
    normalizeUserSocialLinks(user.socialLinks),
    instagramLinksAllowed,
  );
  const activeLinks = getActiveSocialLinks(socialLinks);
  const hasContent = bio.length > 0 || hasAnySocialLink(socialLinks);

  return (
    <ProfileGlassCard>
      <View className="gap-2 px-2 py-1">
        <View className="flex-row items-start justify-start">
          {/* <Text className="font-inter text-base font-semibold text-hive-foreground">
            {t('profile.aboutTitle')}
          </Text> */}
          {onEdit ? (
            <Pressable
              accessibilityLabel={t('profile.editAbout')}
              accessibilityRole="button"
              className="ml-auto h-8 w-8 items-center justify-center rounded-full"
              hitSlop={8}
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.stroke,
              }}
              onPress={onEdit}
            >
              <Pencil color={theme.accent} size={16} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>

        {bio.length > 0 ? (
          <Text className="font-inter text-sm leading-5 text-hive-foreground">{bio}</Text>
        ) : (
          <Text className="font-inter text-sm leading-5 text-hive-muted">{t(emptyBioKey)}</Text>
        )}

        {activeLinks.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {activeLinks.map(({ key, url }) => {
              const meta = SOCIAL_LINK_META[key];

              return (
                <Pressable
                  key={key}
                  accessibilityLabel={t(meta.labelKey)}
                  accessibilityRole="link"
                  className="flex-row items-center gap-2 rounded-full border border-[#FFFFFF14] bg-hive-input-bg px-3 py-2"
                  onPress={() => void Linking.openURL(url)}
                >
                  <SocialLinkIcon socialKey={key} />
                  <Text className="font-inter text-xs font-medium text-hive-foreground">
                    {t(meta.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : hasContent ? null : (
          <Text className="font-inter text-xs text-hive-muted">{t(emptySocialKey)}</Text>
        )}
      </View>
    </ProfileGlassCard>
  );
}
