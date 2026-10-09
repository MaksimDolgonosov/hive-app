import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useHiveTheme } from '@/src/hooks/useHiveTheme';

type ConsentCheckboxProps = {
  checked: boolean;
  invalid?: boolean;
  prefix: string;
  linkLabel: string;
  onCheckedChange: (checked: boolean) => void;
  onOpenDocument: () => void;
};

export function ConsentCheckbox({
  checked,
  invalid = false,
  prefix,
  linkLabel,
  onCheckedChange,
  onOpenDocument,
}: ConsentCheckboxProps) {
  const theme = useHiveTheme();
  const boxClass = checked
    ? 'border-hive-primary bg-hive-primary'
    : invalid
      ? 'border-red-400 bg-hive-surface'
      : 'border-hive-stroke bg-hive-surface';

  return (
    <View className="flex-row items-start gap-3">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        className={`mt-0.5 h-6 w-6 items-center justify-center rounded-md border ${boxClass}`}
        hitSlop={8}
        onPress={() => onCheckedChange(!checked)}
      >
        {checked ? <Check color={theme.textOnAccent} size={16} strokeWidth={3} /> : null}
      </Pressable>

      <Text className="flex-1 font-inter text-[14px] leading-[20px] text-hive-muted">
        <Text
          className="font-inter text-[14px] leading-[20px] text-hive-muted"
          onPress={() => onCheckedChange(!checked)}
        >
          {prefix}{' '}
        </Text>
        <Text
          accessibilityRole="link"
          className="font-inter-semibold text-[14px] text-hive-primary"
          onPress={onOpenDocument}
        >
          {linkLabel}
        </Text>
      </Text>
    </View>
  );
}
