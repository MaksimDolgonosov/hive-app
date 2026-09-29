import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router, type Href } from 'expo-router';
import { Camera, Map, Send, User, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/src/components/ui/GlassSurface';
import { HiveTheme } from '@/src/theme/tokens';

type TabKey = 'map' | 'nearby' | 'camera' | 'profile';

type TabConfig = {
  key: TabKey;
  labelKey: 'tabs.map' | 'tabs.nearby' | 'tabs.camera' | 'tabs.profile';
  icon: LucideIcon;
  routeName?: string;
};

const TABS: TabConfig[] = [
  { key: 'map', labelKey: 'tabs.map', icon: Map, routeName: 'index' },
  { key: 'nearby', labelKey: 'tabs.nearby', icon: Send, routeName: 'nearby' },
  { key: 'camera', labelKey: 'tabs.camera', icon: Camera },
  { key: 'profile', labelKey: 'tabs.profile', icon: User, routeName: 'profile' },
];

const GLASS_CORNER_RADIUS = 28;
const INACTIVE_TAB_COLOR = '#8B7355';
const ACTIVE_TAB_COLOR = '#FFFFFF';

const TAB_SPRING = {
  damping: 22,
  stiffness: 280,
  mass: 0.7,
};

type TabLayout = {
  x: number;
  width: number;
};

export const GLASS_TAB_BAR_HEIGHT = 56;
export const GLASS_TAB_BAR_BOTTOM_GAP = 12;

export function getGlassTabBarInset(bottomSafeArea: number): number {
  return GLASS_TAB_BAR_HEIGHT + GLASS_TAB_BAR_BOTTOM_GAP + bottomSafeArea;
}

function TabBarContent({
  activeTab,
  onPress,
}: {
  activeTab: TabKey;
  onPress: (tab: TabConfig) => void;
}) {
  const { t } = useTranslation();
  const tabLayouts = useRef<Partial<Record<TabKey, TabLayout>>>({});
  const hasAnimated = useRef(false);
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  function movePillTo(key: TabKey, animated: boolean) {
    const layout = tabLayouts.current[key];
    if (!layout) {
      return;
    }

    if (animated) {
      pillX.value = withSpring(layout.x, TAB_SPRING);
      pillWidth.value = withSpring(layout.width, TAB_SPRING);
      return;
    }

    pillX.value = layout.x;
    pillWidth.value = layout.width;
  }

  useEffect(() => {
    movePillTo(activeTab, hasAnimated.current);
    hasAnimated.current = true;
  }, [activeTab]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillWidth.value,
  }));

  function handleTabLayout(key: TabKey, event: LayoutChangeEvent) {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current[key] = { x, width };

    if (key === activeTab) {
      movePillTo(key, hasAnimated.current);
    }
  }

  return (
    <View style={styles.tabsRow}>
      <Animated.View pointerEvents="none" style={[styles.activePill, pillAnimatedStyle]} />

      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const Icon = tab.icon;
        const color = isActive ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onLayout={(event) => handleTabLayout(tab.key, event)}
            onPress={() => onPress(tab)}
            style={styles.tab}
          >
            <Icon color={color} size={20} strokeWidth={2.1} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{t(tab.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const activeRouteName = state.routes[state.index]?.name;
  const activeTab: TabKey =
    activeRouteName === 'profile' ? 'profile' : activeRouteName === 'nearby' ? 'nearby' : 'map';

  function handlePress(tab: TabConfig) {
    if (tab.key === 'camera') {
      router.push('/(modals)/camera' as Href);
      return;
    }

    if (tab.routeName) {
      navigation.navigate(tab.routeName);
    }
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: insets.bottom + GLASS_TAB_BAR_BOTTOM_GAP }]}
    >
      <View style={styles.barContainer}>
        <GlassSurface
          containerStyle={styles.glassContainer}
          cornerRadius={GLASS_CORNER_RADIUS}
          interactive
          style={styles.glassLiquid}
        >
          <TabBarContent activeTab={activeTab} onPress={handlePress} />
        </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  barContainer: {
    width: '100%',
    maxWidth: 358,
    borderRadius: GLASS_CORNER_RADIUS,
  },
  glassLiquid: {
    height: GLASS_TAB_BAR_HEIGHT,
    width: '100%',
  },
  glassContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 4,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 24,
    backgroundColor: HiveTheme.accent,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 24,
    zIndex: 1,
  },
  label: {
    fontFamily: HiveTheme.fontBodySemiBold,
    fontSize: 10,
    fontWeight: '600',
    color: INACTIVE_TAB_COLOR,
  },
  labelActive: {
    color: ACTIVE_TAB_COLOR,
  },
});
