import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BackHandler,
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

import { HiveLoader } from '@/src/components/ui/HiveLoader';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';
import { SAFETY_REPORT_REASONS, type SafetyReportReason } from '@/src/types';
import { canSubmitSafetyReport, SAFETY_COMMENT_MAX_LENGTH } from '@/src/utils/safety-report';

type SafetyReportSheetProps = {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: { reason: SafetyReportReason; comment: string; alsoHide: boolean }) => void;
};

export function SafetyReportSheet({
  visible,
  submitting,
  onClose,
  onSubmit,
}: SafetyReportSheetProps) {
  const { t } = useTranslation();
  const theme = useHiveTheme();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<SafetyReportReason | null>(null);
  const [comment, setComment] = useState('');
  const [alsoHide, setAlsoHide] = useState(false);
  const canSubmit = canSubmitSafetyReport(reason, comment) && !submitting;

  useEffect(() => {
    if (visible) {
      return;
    }

    setReason(null);
    setComment('');
    setAlsoHide(false);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!submitting) {
        onClose();
      }
      return true;
    });

    return () => subscription.remove();
  }, [onClose, submitting, visible]);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          accessibilityLabel={t('safety.hideCancel')}
          accessibilityRole="button"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
          onPress={submitting ? undefined : onClose}
        />
        <View
          style={{
            maxHeight: '88%',
            backgroundColor: theme.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="font-inter text-base font-semibold" style={{ color: theme.text }}>
              {t('safety.reportTitle')}
            </Text>
            <Text className="font-inter text-sm" style={{ color: theme.textMuted }}>
              {t('safety.reportHint')}
            </Text>
            {SAFETY_REPORT_REASONS.map((item) => {
              const selected = reason === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className="py-2"
                  onPress={() => setReason(item)}
                >
                  <Text
                    className="font-inter text-base"
                    style={{
                      color: selected ? theme.accent : theme.text,
                      fontFamily: selected ? theme.fontBodySemiBold : theme.fontBody,
                    }}
                  >
                    {t(`safety.reasons.${item}`)}
                  </Text>
                </Pressable>
              );
            })}
            <TextInput
              maxLength={SAFETY_COMMENT_MAX_LENGTH}
              multiline
              placeholder={t('safety.commentPlaceholder')}
              placeholderTextColor={theme.textDim}
              value={comment}
              style={{
                minHeight: 72,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: theme.text,
                backgroundColor: theme.inputBg,
                fontFamily: theme.fontBody,
                textAlignVertical: 'top',
              }}
              onChangeText={setComment}
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: alsoHide }}
              className="flex-row items-center gap-3 py-1"
              onPress={() => setAlsoHide((current) => !current)}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: alsoHide ? theme.accent : theme.strokeStrong,
                  backgroundColor: alsoHide ? theme.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {alsoHide ? (
                  <Text style={{ color: theme.textOnAccent, fontSize: 14, lineHeight: 16 }}>✓</Text>
                ) : null}
              </View>
              <Text className="flex-1 font-inter text-sm" style={{ color: theme.text }}>
                {t('safety.alsoHide')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
              disabled={!canSubmit}
              style={{
                marginTop: 4,
                borderRadius: 999,
                paddingVertical: 14,
                alignItems: 'center',
                backgroundColor: canSubmit ? theme.accent : theme.surface2,
              }}
              onPress={() => {
                if (!reason || !canSubmit) {
                  return;
                }

                onSubmit({ reason, comment, alsoHide });
              }}
            >
              {submitting ? (
                <HiveLoader color={theme.textOnAccent} size="small" />
              ) : (
                <Text
                  className="font-inter text-base font-bold"
                  style={{ color: canSubmit ? theme.textOnAccent : theme.textDim }}
                >
                  {t('safety.submit')}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
