import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import type { GlassActiveRenderer } from 'expo-liquid-glass-view';
import { router, type Href } from 'expo-router';
import { Camera, Map, User, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shouldUseLiquidGlass } from '@/src/utils/liquid-glass';

type TabKey = 'map' | 'camera' | 'profile';

type TabConfig = {
  key: TabKey;
  labelKey: 'tabs.map' | 'tabs.camera' | 'tabs.profile';
  icon: LucideIcon;
  routeName?: string;
};

const TABS: TabConfig[] = [
  { key: 'map', labelKey: 'tabs.map', icon: Map, routeName: 'index' },
  { key: 'camera', labelKey: 'tabs.camera', icon: Camera },
  { key: 'profile', labelKey: 'tabs.profile', icon: User, routeName: 'profile' },
];

const GLASS_CORNER_RADIUS = 28;
const GLASS_TINT = 'rgba(255, 255, 255, 0.58)';

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

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onLayout={(event) => handleTabLayout(tab.key, event)}
            onPress={() => onPress(tab)}
            style={styles.tab}
          >
            <Icon color={isActive ? '#FFFFFF' : '#8B7355'} size={22} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{t(tab.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AndroidGlassSurface({ children }: { children: ReactNode }) {
  // BlurView поверх MapView на Android ломает рендер карты.
  return <View style={[styles.glass, styles.glassAndroid]}>{children}</View>;
}

function IOSBlurSurface({ children }: { children: ReactNode }) {
  return (
    <BlurView intensity={24} tint="light" style={styles.glass}>
      {children}
    </BlurView>
  );
}

function IOSLiquidGlassSurface({
  children,
  onRendererChange,
}: {
  children: ReactNode;
  onRendererChange: (renderer: GlassActiveRenderer) => void;
}) {
  const { LiquidGlassView } =
    require('expo-liquid-glass-view') as typeof import('expo-liquid-glass-view');

  return (
    <LiquidGlassView
      cornerRadius={GLASS_CORNER_RADIUS}
      cornerStyle="continuous"
      containerStyle={styles.glassContainer}
      interactive
      metal={{
        blurRadius: 10,
        border: { opacity: 0.35, width: 1 },
        frost: 0.38,
        highlight: { angle: 135, intensity: 0.28 },
        saturation: 1.7,
      }}
      style={styles.glassLiquid}
      tint={GLASS_TINT}
      variant="regular"
      onRendererChange={onRendererChange}
    >
      {children}
    </LiquidGlassView>
  );
}

function GlassSurface({ children }: { children: ReactNode }) {
  const [iosRenderer, setIosRenderer] = useState<GlassActiveRenderer | null>(null);
  const useLiquidGlass = shouldUseLiquidGlass();

  if (Platform.OS === 'android') {
    return <AndroidGlassSurface>{children}</AndroidGlassSurface>;
  }

  if (Platform.OS !== 'ios') {
    return <AndroidGlassSurface>{children}</AndroidGlassSurface>;
  }

  if (!useLiquidGlass || iosRenderer === 'fallback-blur') {
    return <IOSBlurSurface>{children}</IOSBlurSurface>;
  }

  return (
    <IOSLiquidGlassSurface onRendererChange={setIosRenderer}>{children}</IOSLiquidGlassSurface>
  );
}

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const activeRouteName = state.routes[state.index]?.name;
  const activeTab: TabKey = activeRouteName === 'profile' ? 'profile' : 'map';

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
      <View style={styles.shadow}>
        <GlassSurface>
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
  shadow: {
    width: '100%',
    maxWidth: 358,
    borderRadius: GLASS_CORNER_RADIUS,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  glass: {
    height: GLASS_TAB_BAR_HEIGHT,
    borderRadius: GLASS_CORNER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: GLASS_TAB_BAR_BOTTOM_GAP,
  },
  glassLiquid: {
    height: GLASS_TAB_BAR_HEIGHT,
    width: '100%',
    marginBottom: GLASS_TAB_BAR_BOTTOM_GAP,
  },
  glassContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  glassAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 4,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    borderRadius: 22,
    backgroundColor: '#F5A623',
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 22,
    zIndex: 1,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#8B7355',
  },
  labelActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
});
