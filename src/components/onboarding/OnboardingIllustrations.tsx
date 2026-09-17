import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import {
  ArrowRight,
  Camera,
  Image as ImageIcon,
  ImageOff,
  MapPin,
  Timer,
} from 'lucide-react-native';

import { HiveMarkerFaceStatic } from '@/src/components/map/HiveMarkerFace';
import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';

const CARD_SIZE = 280;
const CARD_RADIUS = 32;

type IllustrationCardProps = {
  children: ReactNode;
  variant: 'map' | 'panel';
};

function IllustrationCard({ children, variant }: IllustrationCardProps) {
  const theme = useHiveTheme();
  const colorScheme = useAppColorScheme();
  const isLight = colorScheme === 'light';
  const mapColors = isLight ? (['#E8F4E8', '#D4E8C4'] as const) : (['#1E2A1C', '#2A3824'] as const);

  if (variant === 'map') {
    return (
      <LinearGradient
        colors={[...mapColors]}
        end={{ x: 0, y: 1 }}
        start={{ x: 1, y: 0 }}
        style={[styles.card, { borderColor: isLight ? '#FFFFFF80' : theme.stroke }]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        styles.panelCard,
        {
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.9)' : theme.surface,
          borderColor: isLight ? '#FFFFFF80' : theme.stroke,
        },
      ]}
    >
      {children}
    </View>
  );
}

function PhotoPin({
  size = 28,
  left,
  top,
}: {
  size?: number;
  left: DimensionValue;
  top: DimensionValue;
}) {
  const theme = useHiveTheme();

  return (
    <View
      style={[
        styles.photoPin,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.accent,
          left,
          top,
        },
      ]}
    >
      <Camera color={theme.accent} size={Math.round(size * 0.43)} strokeWidth={2.4} />
    </View>
  );
}

export function PermissionIllustration({ children }: { children: ReactNode }) {
  const theme = useHiveTheme();

  return (
    <View
      style={[
        styles.card,
        styles.panelCard,
        { backgroundColor: theme.surface, borderColor: theme.stroke },
      ]}
    >
      {children}
    </View>
  );
}

export function WelcomeIllustration() {
  const colorScheme = useAppColorScheme();
  const isLight = colorScheme === 'light';

  return (
    <IllustrationCard variant="map">
      <View
        style={[
          styles.mapBlob,
          styles.welcomeBlob1,
          { backgroundColor: isLight ? '#B8D4A8BB' : '#3A4F34CC' },
        ]}
      />
      <View
        style={[
          styles.mapBlob,
          styles.welcomeBlob2,
          { backgroundColor: isLight ? '#A8C898BB' : '#4A6340CC' },
        ]}
      />
      <View
        style={[
          styles.mapBlob,
          styles.welcomeBlob3,
          { backgroundColor: isLight ? '#C8D8B0AA' : '#3F5338CC' },
        ]}
      />
      <View style={styles.userDot} />
      <PhotoPin left="28.57%" top="25%" />
      <PhotoPin left="64.29%" top="42.86%" />
      <PhotoPin left="42.86%" top="67.86%" />
      <PhotoPin left="71.43%" top="21.43%" />
    </IllustrationCard>
  );
}

export function CameraIllustration({
  galleryUnavailableLabel,
}: {
  galleryUnavailableLabel: string;
}) {
  const theme = useHiveTheme();
  const colorScheme = useAppColorScheme();
  const isLight = colorScheme === 'light';

  return (
    <IllustrationCard variant="panel">
      <View
        style={[
          styles.phone,
          {
            backgroundColor: isLight ? '#2C1810' : '#0B0A08',
            borderColor: isLight ? '#FFFFFF80' : theme.strokeStrong,
          },
        ]}
      >
        <View style={styles.phoneNotch} />
        <LinearGradient
          colors={[theme.accent, '#E5A400']}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={styles.phoneScreen}
        >
          <Camera color="#FFFFFF" size={36} strokeWidth={2} />
        </LinearGradient>
        <View style={[styles.shutterOuter, { backgroundColor: theme.accent }]}>
          <View style={styles.shutterInner} />
        </View>
      </View>

      <View style={[styles.galleryBadge, { borderColor: `${theme.danger}44` }]}>
        <ImageOff color={theme.danger} size={16} strokeWidth={2.2} />
        <Text
          style={[
            styles.galleryBadgeLabel,
            { color: theme.danger, fontFamily: theme.fontBodySemiBold },
          ]}
        >
          {galleryUnavailableLabel}
        </Text>
      </View>
    </IllustrationCard>
  );
}

export function LifetimeIllustration({
  lifetimeLabel,
  locationLabel,
}: {
  lifetimeLabel: string;
  locationLabel: string;
}) {
  const theme = useHiveTheme();

  return (
    <IllustrationCard variant="panel">
      <View style={styles.lifetimeRow}>
        <View style={[styles.photoTile, { backgroundColor: theme.accent, opacity: 0.4 }]}>
          <ImageIcon color="rgba(255, 255, 255, 0.66)" size={28} strokeWidth={2} />
        </View>
        <ArrowRight color={theme.textMuted} size={20} strokeWidth={2} />
        <View
          style={[
            styles.photoTile,
            { backgroundColor: theme.accent, borderColor: theme.accent, borderWidth: 2 },
          ]}
        >
          <ImageIcon color="#FFFFFF" size={28} strokeWidth={2} />
        </View>
      </View>

      <View style={[styles.lifetimeBadge, { backgroundColor: theme.accentSoft }]}>
        <Timer color={theme.accent} size={20} strokeWidth={2.2} />
        <Text
          style={[
            styles.lifetimeBadgeLabel,
            { color: theme.accent, fontFamily: theme.fontBodyBold },
          ]}
        >
          {lifetimeLabel}
        </Text>
      </View>

      <View style={styles.locationRow}>
        <MapPin color={theme.textMuted} size={14} strokeWidth={2.2} />
        <Text
          style={[styles.locationLabel, { color: theme.textMuted, fontFamily: theme.fontBody }]}
        >
          {locationLabel}
        </Text>
      </View>
    </IllustrationCard>
  );
}

export function HiveIllustration() {
  return (
    <IllustrationCard variant="map">
      <PhotoPin left="14.29%" size={32} top="17.86%" />
      <PhotoPin left="71.43%" size={32} top="28.57%" />
      <PhotoPin left="28.57%" size={32} top="64.29%" />
      <View style={styles.hiveMark}>
        <HiveMarkerFaceStatic count={12} />
      </View>
    </IllustrationCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: CARD_SIZE,
    aspectRatio: 1,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  panelCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  mapBlob: {
    position: 'absolute',
    borderRadius: 10,
  },
  welcomeBlob1: {
    width: '32.14%',
    height: '21.43%',
    left: '10.71%',
    top: '14.29%',
  },
  welcomeBlob2: {
    width: '39.29%',
    height: '25%',
    left: '50%',
    top: '28.57%',
  },
  welcomeBlob3: {
    width: '46.43%',
    height: '17.86%',
    left: '21.43%',
    top: '57.14%',
    borderRadius: 8,
  },
  userDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    left: '45%',
    top: '46.43%',
  },
  photoPin: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: 120,
    height: 200,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  phoneNotch: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  galleryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 90, 0.13)',
    borderWidth: 1,
  },
  galleryBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  lifetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photoTile: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifetimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  lifetimeBadgeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  hiveMark: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
