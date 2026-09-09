import { useEffect, useRef } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

import { OTP_LENGTH, sanitizeOtpCode } from '@/src/utils/otp';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
};

export function OtpInput({
  value,
  onChange,
  error = false,
  disabled = false,
  accessibilityLabel,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = sanitizeOtpCode(value);
  const activeIndex = Math.min(digits.length, OTP_LENGTH - 1);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  function focusInput() {
    if (disabled) {
      return;
    }

    inputRef.current?.focus();
  }

  return (
    <Pressable accessibilityRole="button" onPress={focusInput}>
      <View className="relative">
        <View className="flex-row justify-between gap-2" pointerEvents="none">
          {Array.from({ length: OTP_LENGTH }, (_, index) => {
            const isActive = !disabled && index === activeIndex;
            const borderClass = error
              ? 'border-red-400'
              : isActive
                ? 'border-hive-primary'
                : 'border-hive-stroke';

            return (
              <View
                key={index}
                className={`h-14 flex-1 items-center justify-center rounded-hive-md border bg-hive-input-bg ${borderClass}`}
              >
                <Text className="font-inter text-xl font-semibold text-hive-foreground">
                  {digits[index] ?? ''}
                </Text>
              </View>
            );
          })}
        </View>

        <TextInput
          ref={inputRef}
          accessibilityLabel={accessibilityLabel}
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          autoCorrect={false}
          autoFocus
          caretHidden
          editable={!disabled}
          importantForAutofill="yes"
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: 0.02,
            color: 'transparent',
          }}
          textContentType="oneTimeCode"
          value={digits}
          onChangeText={(text) => onChange(sanitizeOtpCode(text))}
        />
      </View>
    </Pressable>
  );
}
