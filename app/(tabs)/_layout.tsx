import { Tabs } from 'expo-router';
import { useEffect } from 'react';

import { GlassTabBar } from '@/src/components/ui/GlassTabBar';
import { useHydrateLastKnownLocation } from '@/src/hooks/useHydrateLastKnownLocation';
import { useTabsRegionSubscription } from '@/src/hooks/useTabsRegionSubscription';
import { useSavedMapPlacesStore } from '@/src/stores/savedMapPlacesStore';

function TabsRegionBridge() {
  useHydrateLastKnownLocation();
  useTabsRegionSubscription();
  useHydrateSavedMapPlaces();
  return null;
}

function useHydrateSavedMapPlaces() {
  const hydrate = useSavedMapPlacesStore((state) => state.hydrate);
  const isHydrated = useSavedMapPlacesStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);
}

export default function TabLayout() {
  return (
    <>
      <TabsRegionBridge />
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Карта' }} />
        <Tabs.Screen name="nearby" options={{ title: 'Рядом' }} />
        <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
      </Tabs>
    </>
  );
}
