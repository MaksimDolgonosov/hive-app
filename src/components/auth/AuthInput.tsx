import type { LucideIcon } from 'lucide-react-native';
import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

type AuthInputProps = TextInputProps & {
  label: string;
  icon: LucideIcon;
  error?: string;
};

export function AuthInput({ label, icon: Icon, error, ...inputProps }: AuthInputProps) {
  return (
    <View className="gap-1.5">
      <Text className="font-inter text-[13px] font-semibold text-hive-foreground">{label}</Text>
      <View
        className={`h-12 flex-row items-center gap-2.5 rounded-hive-md border bg-hive-input-bg px-3.5 ${
          error ? 'border-red-400' : 'border-[#F5A62333]'
        }`}
      >
        <Icon color="#8B7355" size={18} strokeWidth={2} />
        <TextInput
          {...inputProps}
          className="flex-1 font-inter text-[15px] text-hive-foreground"
          placeholderTextColor="#8B7355"
        />
      </View>
      {error ? <Text className="font-inter text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
