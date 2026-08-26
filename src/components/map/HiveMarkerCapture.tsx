import { Hexagon } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

const MARKER_SIZE = 52;
const ICON_SIZE = 18;

interface HiveMarkerCaptureProps {
  hiveId: string;
  count: number;
  onCaptured: (hiveId: string, uri: string) => void;
}

export function HiveMarkerCapture({ hiveId, count, onCaptured }: HiveMarkerCaptureProps) {
  const viewRef = useRef<View>(null);

  const capture = useCallback(async () => {
    if (!viewRef.current) {
      return;
    }

    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      onCaptured(hiveId, uri);
    } catch {
      // Повторим на следующем layout/таймере.
    }
  }, [count, hiveId, onCaptured]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void capture();
    }, 80);

    return () => clearTimeout(timer);
  }, [capture]);

  return (
    <View
      ref={viewRef}
      collapsable={false}
      pointerEvents="none"
      style={styles.offscreen}
      onLayout={() => {
        void capture();
      }}
    >
      <View collapsable={false} style={styles.marker}>
        <Hexagon color="#FFFFFF" fill="#FFFFFF" size={ICON_SIZE} strokeWidth={0} />
        <Text style={styles.count}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    opacity: 0,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: '#F5A623',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  count: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    includeFontPadding: false,
  },
});
