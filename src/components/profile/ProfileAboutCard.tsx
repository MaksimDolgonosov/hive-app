import { Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Text, View } from 'react-native';

import { SOCIAL_LINK_META } from '@/src/constants/social-links';
import type { User } from '@/src/types';
import { getActiveSocialLinks, hasAnySocialLink, normalizeUserSocialLinks } from '@/src/utils/social-links';

import { ProfileGlassCard } from './ProfileGlassCard';

type ProfileAboutCardProps = {
  user: User;
  onEdit: () => void;
};

export function ProfileAboutCard({ user, onEdit }: ProfileAboutCardProps) {
  const { t } = useTranslation();
  const bio = user.bio?.trim() ?? '';
  const socialLinks = normalizeUserSocialLinks(user.socialLinks);
  const activeLinks = getActiveSocialLinks(socialLinks);
  const hasContent = bio.length > 0 || hasAnySocialLink(socialLinks);

  return (
    <ProfileGlassCard>
      <View className="gap-4 px-5 py-5">
        <View className="flex-row items-center justify-between">
          <Text className="font-inter text-base font-semibold text-hive-foreground">
            {t('profile.aboutTitle')}
          </Text>
          <Pressable
            accessibilityLabel={t('profile.editAbout')}
            accessibilityRole="button"
            className="h-8 w-8 items-center justify-center rounded-full bg-hive-primary/15"
            hitSlop={8}
            onPress={onEdit}
          >
            <Pencil color="#F5A623" size={16} />
          </Pressable>
        </View>

        {bio.length > 0 ? (
          <Text className="font-inter text-sm leading-5 text-hive-foreground">{bio}</Text>
        ) : (
          <Text className="font-inter text-sm leading-5 text-hive-muted">{t('profile.aboutEmpty')}</Text>
        )}

        {activeLinks.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {activeLinks.map(({ key, url }) => {
              const meta = SOCIAL_LINK_META[key];
              const Icon = meta.icon;

              return (
                <Pressable
                  key={key}
                  accessibilityLabel={t(meta.labelKey)}
                  accessibilityRole="link"
                  className="flex-row items-center gap-2 rounded-full border border-[#F5A62333] bg-hive-input-bg px-3 py-2"
                  onPress={() => void Linking.openURL(url)}
                >
                  <Icon color={meta.color} size={16} />
                  <Text className="font-inter text-xs font-medium text-hive-foreground">
                    {t(meta.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : hasContent ? null : (
          <Text className="font-inter text-xs text-hive-muted">{t('profile.socialEmpty')}</Text>
        )}
      </View>
    </ProfileGlassCard>
  );
}
