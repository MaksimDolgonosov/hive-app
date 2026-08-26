import { StyleSheet, View } from 'react-native';

type ShutterFlashProps = {
  visible: boolean;
};

/** Имитация вспышки затвора — единственный мгновенный feedback на iOS, пока камера активна. */
export function ShutterFlash({ visible }: ShutterFlashProps) {
  if (!visible) {
    return null;
  }

  return <View pointerEvents="none" style={styles.flash} />;
}

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
});
