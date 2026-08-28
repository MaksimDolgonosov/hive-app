import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { HiveMarkerFaceStatic } from '@/src/components/map/HiveMarkerFace';
import { getHiveMarkerVisualMetrics } from '@/src/utils/hive-marker-visual';

interface HiveMarkerCaptureProps {
  hiveId: string;
  count: number;
  onCaptured: (hiveId: string, uri: string) => void;
}

export function HiveMarkerCapture({ hiveId, count, onCaptured }: HiveMarkerCaptureProps) {
  const viewRef = useRef<View>(null);
  const metrics = getHiveMarkerVisualMetrics(count);

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
      style={[
        styles.offscreen,
        {
          width: metrics.markerSize,
          height: metrics.markerSize,
        },
      ]}
      onLayout={() => {
        void capture();
      }}
    >
      <HiveMarkerFaceStatic count={count} />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
    opacity: 0,
  },
});
