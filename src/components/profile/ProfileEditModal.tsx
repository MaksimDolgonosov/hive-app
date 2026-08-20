import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { SOCIAL_LINK_META } from '@/src/constants/social-links';
import { useUpdateProfile } from '@/src/hooks/useUpdateProfile';
import {
  PROFILE_BIO_MAX_LENGTH,
  PROFILE_SOCIAL_LINK_MAX_LENGTH,
  SOCIAL_LINK_KEYS,
  type SocialLinkKey,
  type User,
  type UserSocialLinks,
} from '@/src/types';
import { normalizeUserSocialLinks } from '@/src/utils/social-links';
import { showApiErrorToast } from '@/src/utils/show-toast';

type ProfileEditModalProps = {
  visible: boolean;
  user: User;
  onClose: () => void;
};

type SocialLinkDrafts = Record<SocialLinkKey, string>;

function toSocialDrafts(links: UserSocialLinks): SocialLinkDrafts {
  return SOCIAL_LINK_KEYS.reduce((acc, key) => {
    acc[key] = links[key] ?? '';
    return acc;
  }, {} as SocialLinkDrafts);
}

function draftsToSocialLinks(drafts: SocialLinkDrafts): UserSocialLinks {
  return SOCIAL_LINK_KEYS.reduce((acc, key) => {
    const trimmed = drafts[key].trim();
    acc[key] = trimmed.length > 0 ? trimmed : null;
    return acc;
  }, {} as UserSocialLinks);
}

export function ProfileEditModal({ visible, user, onClose }: ProfileEditModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const updateProfile = useUpdateProfile();

  const [bio, setBio] = useState(user.bio ?? '');
  const [socialDrafts, setSocialDrafts] = useState<SocialLinkDrafts>(() =>
    toSocialDrafts(normalizeUserSocialLinks(user.socialLinks)),
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setBio(user.bio ?? '');
    setSocialDrafts(toSocialDrafts(normalizeUserSocialLinks(user.socialLinks)));
  }, [user, visible]);

  function updateSocialDraft(key: SocialLinkKey, value: string) {
    setSocialDrafts((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (updateProfile.isPending) {
      return;
    }

    try {
      await updateProfile.mutateAsync({
        bio: bio.trim() || null,
        socialLinks: draftsToSocialLinks(socialDrafts),
      });
      onClose();
    } catch (error) {
      showApiErrorToast(error, {
        titleKey: 'profile.updateFailedTitle',
        fallbackKey: 'profile.updateFailedMessage',
      });
    }
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityRole="button" className="flex-1 bg-black/40" onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="mt-auto flex-1 justify-end"
          keyboardVerticalOffset={0}
        >
          <Pressable
            className="max-h-[90%] rounded-t-[20px] bg-hive-bg"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="items-center pt-3">
              <View className="h-1 w-10 rounded-full bg-hive-primary/30" />
            </View>

            <ScrollView
              bounces={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: insets.bottom + 20,
                gap: 16,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-center font-inter text-lg font-semibold text-hive-foreground">
                {t('profile.editAbout')}
              </Text>

              <View className="gap-1.5">
                <Text className="font-inter text-[13px] font-semibold text-hive-foreground">
                  {t('profile.bioLabel')}
                </Text>
                <TextInput
                  className="min-h-[96px] rounded-hive-md border border-[#F5A62333] bg-hive-input-bg px-3.5 py-2.5 font-inter text-[15px] text-hive-foreground"
                  maxLength={PROFILE_BIO_MAX_LENGTH}
                  multiline
                  placeholder={t('profile.bioPlaceholder')}
                  placeholderTextColor="#8B7355"
                  textAlignVertical="top"
                  value={bio}
                  onChangeText={setBio}
                />
                <Text className="text-right font-inter text-xs text-hive-muted">
                  {t('profile.bioCounter', { count: bio.length, max: PROFILE_BIO_MAX_LENGTH })}
                </Text>
              </View>

              <View className="gap-3">
                <Text className="font-inter text-[13px] font-semibold text-hive-foreground">
                  {t('profile.socialTitle')}
                </Text>
                <Text className="font-inter text-xs leading-4 text-hive-muted">
                  {t('profile.socialHint')}
                </Text>

                {SOCIAL_LINK_KEYS.map((key) => {
                  const meta = SOCIAL_LINK_META[key];
                  const Icon = meta.icon;

                  return (
                    <View key={key} className="gap-1.5">
                      <View className="flex-row items-center gap-2">
                        <Icon color={meta.color} size={16} />
                        <Text className="font-inter text-[13px] font-semibold text-hive-foreground">
                          {t(meta.labelKey)}
                        </Text>
                      </View>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        className="h-12 rounded-hive-md border border-[#F5A62333] bg-hive-input-bg px-3.5 font-inter text-[15px] text-hive-foreground"
                        maxLength={PROFILE_SOCIAL_LINK_MAX_LENGTH}
                        placeholder={t(`profile.socialPlaceholder.${key}`)}
                        placeholderTextColor="#8B7355"
                        value={socialDrafts[key]}
                        onChangeText={(value) => updateSocialDraft(key, value)}
                      />
                    </View>
                  );
                })}
              </View>

              <AuthButton
                loading={updateProfile.isPending}
                title={t('profile.saveProfile')}
                onPress={() => void handleSave()}
              />

              <Pressable
                accessibilityRole="button"
                className="items-center py-2"
                disabled={updateProfile.isPending}
                onPress={onClose}
              >
                {updateProfile.isPending ? (
                  <ActivityIndicator color="#8B7355" size="small" />
                ) : (
                  <Text className="font-inter text-sm font-semibold text-hive-muted">
                    {t('profile.avatarCancel')}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
