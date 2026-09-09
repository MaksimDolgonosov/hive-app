import type { LucideIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { Platform, Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type AuthInputProps = TextInputProps & {
  label: string;
  icon: LucideIcon;
  error?: string;
};

const TEXT_CONTENT_TYPE_BY_AUTOCOMPLETE: Partial<
  Record<NonNullable<TextInputProps['autoComplete']>, TextInputProps['textContentType']>
> = {
  email: 'emailAddress',
  password: 'password',
  username: 'username',
  name: 'name',
  'new-password': 'newPassword',
};

function resolveAutofillSettings(
  autoComplete: TextInputProps['autoComplete'],
  keyboardType: TextInputProps['keyboardType'],
  textContentType: TextInputProps['textContentType'],
  secureTextEntry: boolean | undefined,
) {
  const semanticTextContentType =
    textContentType ?? (autoComplete ? TEXT_CONTENT_TYPE_BY_AUTOCOMPLETE[autoComplete] : undefined);

  const isEmailField =
    autoComplete === 'email' ||
    keyboardType === 'email-address' ||
    semanticTextContentType === 'emailAddress';

  const isAutofillSensitive =
    !secureTextEntry &&
    (isEmailField ||
      autoComplete === 'username' ||
      autoComplete === 'name' ||
      semanticTextContentType === 'username' ||
      semanticTextContentType === 'name');

  // iOS/Android autofill on email and name fields often intercepts taps
  // and skips opening the software keyboard. Password keeps secureTextEntry autofill.
  const disableNativeAutofill = isAutofillSensitive;

  return {
    autoComplete: disableNativeAutofill ? ('off' as const) : autoComplete,
    importantForAutofill:
      Platform.OS === 'android' && disableNativeAutofill ? ('no' as const) : undefined,
    textContentType:
      Platform.OS === 'ios' && disableNativeAutofill ? ('none' as const) : semanticTextContentType,
  };
}

export function AuthInput({
  label,
  icon: Icon,
  error,
  autoComplete,
  textContentType,
  keyboardType,
  secureTextEntry,
  ...inputProps
}: AuthInputProps) {
  const inputRef = useRef<TextInput>(null);
  const theme = useHiveTheme();

  function focusInput() {
    inputRef.current?.focus();
  }

  const autofill = resolveAutofillSettings(
    autoComplete,
    keyboardType,
    textContentType,
    secureTextEntry,
  );

  const isEmailField =
    autoComplete === 'email' ||
    keyboardType === 'email-address' ||
    textContentType === 'emailAddress';

  return (
    <View className="gap-1.5">
      <Pressable accessibilityRole="button" hitSlop={8} onPress={focusInput}>
        <Text className="font-inter text-[11px] font-semibold uppercase tracking-[1.2px] text-hive-dim">
          {label}
        </Text>
      </Pressable>

      <View
        className={`h-14 flex-row items-center gap-3 rounded-hive-md border bg-hive-input-bg px-[18px] ${
          error ? 'border-red-400' : 'border-hive-stroke'
        }`}
      >
        <Pressable accessibilityRole="button" hitSlop={8} onPress={focusInput}>
          <View pointerEvents="none">
            <Icon color={theme.textDim} size={18} strokeWidth={2} />
          </View>
        </Pressable>

        <TextInput
          {...inputProps}
          ref={inputRef}
          autoCapitalize={inputProps.autoCapitalize ?? (isEmailField ? 'none' : undefined)}
          autoComplete={autofill.autoComplete}
          autoCorrect={false}
          importantForAutofill={autofill.importantForAutofill}
          keyboardType={keyboardType}
          placeholderTextColor={theme.textDim}
          secureTextEntry={secureTextEntry}
          showSoftInputOnFocus
          spellCheck={false}
          style={{ flex: 1, minWidth: 0, height: 56, paddingVertical: 0 }}
          textContentType={autofill.textContentType}
          className="font-inter text-[15px] text-hive-foreground"
        />
      </View>

      {error ? <Text className="font-inter text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
