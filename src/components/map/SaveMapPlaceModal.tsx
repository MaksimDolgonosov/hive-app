import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { SAVED_MAP_PLACE_NAME_MAX_LENGTH } from '@/src/types';

type SaveMapPlaceModalProps = {
  visible: boolean;
  initialName: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
};

export function SaveMapPlaceModal({
  visible,
  initialName,
  saving = false,
  onClose,
  onSave,
}: SaveMapPlaceModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) {
      setName(initialName);
    }
  }, [initialName, visible]);

  function handleSave() {
    onSave(name.trim());
  }

  const canSave = name.trim().length > 0 && !saving;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        <Pressable accessibilityRole="button" className="flex-1 bg-black/35" onPress={onClose} />

        <View
          className="rounded-t-[24px] bg-hive-bg px-5 pt-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-hive-primary/30" />

          <Text className="font-inter text-xl font-bold text-hive-foreground">
            {t('map.savePlaceTitle')}
          </Text>
          <Text className="mt-2 font-inter text-sm leading-5 text-hive-muted">
            {t('map.savePlaceDescription')}
          </Text>

          <Text className="mb-2 mt-5 font-inter text-sm font-semibold text-hive-foreground">
            {t('map.savePlaceNameLabel')}
          </Text>
          <TextInput
            autoCapitalize="sentences"
            autoCorrect={false}
            className="rounded-hive-md border border-[#F5A62333] bg-white px-4 py-3 font-inter text-base text-hive-foreground"
            maxLength={SAVED_MAP_PLACE_NAME_MAX_LENGTH}
            placeholder={t('map.savePlaceNamePlaceholder')}
            placeholderTextColor="#8B7355"
            returnKeyType="done"
            value={name}
            onChangeText={setName}
            onSubmitEditing={() => {
              if (canSave) {
                handleSave();
              }
            }}
          />
          <Text className="mt-1 text-right font-inter text-xs text-hive-muted">
            {t('map.savePlaceNameCounter', {
              count: name.length,
              max: SAVED_MAP_PLACE_NAME_MAX_LENGTH,
            })}
          </Text>

          <View className="mt-5 gap-3">
            <AuthButton
              disabled={!canSave}
              loading={saving}
              title={t('map.savePlaceConfirm')}
              onPress={handleSave}
            />
            <Pressable
              accessibilityRole="button"
              className="items-center py-2"
              disabled={saving}
              onPress={onClose}
            >
              <Text className="font-inter text-base font-semibold text-hive-muted">
                {t('map.savePlaceCancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
