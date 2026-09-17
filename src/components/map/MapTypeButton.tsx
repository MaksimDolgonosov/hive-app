import { Globe, Map } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { MapOverlayButton } from '@/src/components/map/MapOverlayButton';
import type { HiveMapType } from '@/src/types';

type MapTypeButtonProps = {
  mapType: HiveMapType;
  onPress: () => void;
};

export function MapTypeButton({ mapType, onPress }: MapTypeButtonProps) {
  const { t } = useTranslation();
  const isSatellite = mapType === 'satellite';

  return (
    <MapOverlayButton
      accessibilityLabel={t(isSatellite ? 'map.showScheme' : 'map.showSatellite')}
      icon={isSatellite ? Map : Globe}
      onPress={onPress}
    />
  );
}
