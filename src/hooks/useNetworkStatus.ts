import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

function isOfflineState(state: NetInfoState): boolean {
  // isInternetReachable часто ложно false на Android-эмуляторе при рабочей сети.
  return state.isConnected === false;
}

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(isOfflineState(state));
    });

    void NetInfo.fetch().then((state) => {
      setIsOffline(isOfflineState(state));
    });

    return unsubscribe;
  }, []);

  return { isOffline };
}
