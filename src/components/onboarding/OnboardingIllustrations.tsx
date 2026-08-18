import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Camera,
  Hexagon,
  Image as ImageIcon,
  ImageOff,
  MapPin,
  Timer,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

const CARD_SIZE = 280;
const CARD_RADIUS = 32;

function IllustrationCard({
  children,
  gradient,
  contentStyle,
}: {
  children: React.ReactNode;
  gradient?: readonly [string, string];
  contentStyle?: object;
}) {
  if (gradient) {
    return (
      <LinearGradient
        colors={[...gradient]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.cardGradient}
      >
        {children}
      </LinearGradient>
    );
  }

  return <View style={[styles.card, contentStyle]}>{children}</View>;
}

export function WelcomeMapIllustration() {
  const markers = [
    { left: 80, top: 70 },
    { left: 180, top: 120 },
    { left: 120, top: 190 },
    { left: 200, top: 60 },
  ];

  return (
    <IllustrationCard gradient={['#E8F4E8', '#D4E8C4']}>
      <View style={[styles.mapBlock, { left: 30, top: 40, width: 90, height: 60 }]} />
      <View style={[styles.mapBlock, { left: 140, top: 80, width: 110, height: 70 }]} />
      <View style={[styles.mapBlock, { left: 60, top: 160, width: 130, height: 50, borderRadius: 8 }]} />
      <View style={styles.userDot} />
      {markers.map((marker, index) => (
        <View key={index} style={[styles.photoMarker, { left: marker.left, top: marker.top }]}>
          <Camera color="#F5A623" size={12} strokeWidth={2} />
        </View>
      ))}
    </IllustrationCard>
  );
}

export function CameraIllustration() {
  const { t } = useTranslation();

  return (
    <IllustrationCard contentStyle={styles.cameraCard}>
      <View style={styles.phone}>
        <View style={styles.phoneNotch} />
        <LinearGradient colors={['#FFD54F', '#F5A623']} style={styles.phoneScreen}>
          <Camera color="#FFFFFF" size={36} strokeWidth={2} />
        </LinearGradient>
        <View style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </View>
      </View>

      <View style={styles.galleryBadge}>
        <ImageOff color="#FF5252" size={16} strokeWidth={2} />
        <Text style={styles.galleryBadgeText}>{t('onboarding.galleryUnavailable')}</Text>
      </View>
    </IllustrationCard>
  );
}

export function FourHoursIllustration() {
  const { t } = useTranslation();

  return (
    <IllustrationCard contentStyle={styles.fourHoursCard}>
      <View style={styles.photoFlow}>
        <View style={[styles.photoTile, styles.photoTileFaded]}>
          <ImageIcon color="#FFFFFFAA" size={28} strokeWidth={2} />
        </View>
        <ArrowRight color="#8B7355" size={20} strokeWidth={2} />
        <View style={[styles.photoTile, styles.photoTileActive]}>
          <ImageIcon color="#FFFFFF" size={28} strokeWidth={2} />
        </View>
      </View>

      <View style={styles.timerBadge}>
        <Timer color="#F5A623" size={20} strokeWidth={2} />
        <Text style={styles.timerBadgeText}>{t('onboarding.expiresInFourHours')}</Text>
      </View>

      <View style={styles.locationHint}>
        <MapPin color="#8B7355" size={14} strokeWidth={2} />
        <Text style={styles.locationHintText}>{t('onboarding.publishedAtLocation')}</Text>
      </View>
    </IllustrationCard>
  );
}

export function HiveIllustration() {
  return (
    <IllustrationCard contentStyle={styles.hiveCard}>
      <View style={[styles.mapBlock, styles.hiveArea]} />
      <View style={styles.hiveCluster}>
        <LinearGradient colors={['#F5A623', '#FF8C00']} style={styles.hiveMarkerLarge}>
          <Hexagon color="#FFFFFF" fill="#FFFFFF" size={24} strokeWidth={0} />
        </LinearGradient>
        <View style={styles.hiveMarkerSmall}>
          <Hexagon color="#F5A623" size={16} strokeWidth={2} />
        </View>
        <View style={[styles.hiveMarkerSmall, { marginTop: 12 }]}>
          <Hexagon color="#F5A623" size={16} strokeWidth={2} />
        </View>
      </View>
    </IllustrationCard>
  );
}

export function PermissionIllustration({ children }: { children: React.ReactNode }) {
  return <View style={[styles.card, styles.permissionCard]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_RADIUS,
    backgroundColor: '#FFFFFFE6',
    borderWidth: 1,
    borderColor: '#FFFFFF80',
    overflow: 'hidden',
  },
  cardGradient: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: '#FFFFFF80',
    overflow: 'hidden',
  },
  mapBlock: {
    position: 'absolute',
    backgroundColor: '#B8D4A8BB',
    borderRadius: 10,
  },
  userDot: {
    position: 'absolute',
    left: 126,
    top: 130,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFFE6',
    borderWidth: 2,
    borderColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 24,
  },
  phone: {
    width: 120,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#2C1810',
    borderWidth: 1,
    borderColor: '#FFFFFF80',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  phoneNotch: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF33',
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
    backgroundColor: '#F5A623',
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
    backgroundColor: '#FF525222',
    borderWidth: 1,
    borderColor: '#FF525244',
  },
  galleryBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#FF5252',
  },
  fourHoursCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  photoFlow: {
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
    borderWidth: 1,
    borderColor: '#FFFFFF80',
  },
  photoTileFaded: {
    backgroundColor: '#FFD54F',
    opacity: 0.4,
  },
  photoTileActive: {
    backgroundColor: '#FFD54F',
    borderWidth: 2,
    borderColor: '#F5A623',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5A62322',
  },
  timerBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#F5A623',
  },
  locationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationHintText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B7355',
  },
  hiveCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiveArea: {
    width: 180,
    height: 100,
    left: 50,
    top: 90,
    opacity: 0.55,
  },
  hiveCluster: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 1,
  },
  hiveMarkerLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiveMarkerSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFFE6',
    borderWidth: 2,
    borderColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
