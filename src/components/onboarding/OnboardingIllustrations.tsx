import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

const CARD_SIZE = 280;
const CARD_RADIUS = 32;

export function PermissionIllustration({ children }: { children: ReactNode }) {
  return <View style={[styles.card, styles.permissionCard]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_RADIUS,
    backgroundColor: '#15130F',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    overflow: 'hidden',
  },
  permissionCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
