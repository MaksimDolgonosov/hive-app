import { Bookmark } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { MapOverlayButton } from '@/src/components/map/MapOverlayButton';

type MapBookmarkButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function MapBookmarkButton({ onPress, disabled = false }: MapBookmarkButtonProps) {
  const { t } = useTranslation();

  return (
    <MapOverlayButton
      accessibilityLabel={t('map.saveFavorite')}
      disabled={disabled}
      icon={Bookmark}
      onPress={onPress}
    />
  );
}
