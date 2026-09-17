import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { FlatList, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';
import { HIVE_NATIVEWIND_VARS } from '@/src/theme/nativewind-vars';

const LIST_MAX_HEIGHT = 320;

export type SettingsChoice<T extends string> = {
  value: T;
  label: string;
  leading?: ReactNode;
};

type SettingsChoiceSheetProps<T extends string> = {
  visible: boolean;
  title: string;
  options: SettingsChoice<T>[];
  selected: T;
  onClose: () => void;
  onSelect: (value: T) => void;
};

export function SettingsChoiceSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onClose,
  onSelect,
}: SettingsChoiceSheetProps<T>) {
  const theme = useHiveTheme();
  const colorScheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const listMaxHeight = Math.min(LIST_MAX_HEIGHT, windowHeight * 0.45);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        className="flex-1 justify-end bg-black/40"
        style={HIVE_NATIVEWIND_VARS[colorScheme]}
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-[20px] bg-hive-surface px-4 pt-4"
          style={{ paddingBottom: insets.bottom + 16 }}
          onPress={(event) => event.stopPropagation()}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-hive-primary/30" />
          <Text className="mb-3 text-center font-inter text-base font-semibold text-hive-foreground">
            {title}
          </Text>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={{ maxHeight: listMaxHeight }}
            renderItem={({ item }) => {
              const isActive = selected === item.value;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  className="flex-row items-center justify-between rounded-hive-md px-3 py-3.5"
                  style={{ backgroundColor: isActive ? theme.accentSoft : 'transparent' }}
                  onPress={() => onSelect(item.value)}
                >
                  <View className="flex-1 flex-row items-center gap-3">
                    {item.leading}
                    <Text
                      className={`font-inter text-[15px] ${isActive ? 'font-semibold' : 'font-medium'}`}
                      style={{ color: isActive ? theme.accent : theme.text }}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {isActive && <Check color={theme.accent} size={18} strokeWidth={2.5} />}
                </Pressable>
              );
            }}
            showsVerticalScrollIndicator
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
