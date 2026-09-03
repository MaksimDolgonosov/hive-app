import { useEffect, useState } from 'react';

export function useResendCooldown(availableAtMs: number | null) {
  const [now, setNow] = useState(() => Date.now());

  const remainingSec = availableAtMs ? Math.max(0, Math.ceil((availableAtMs - now) / 1000)) : 0;
  const isCoolingDown = remainingSec > 0;

  useEffect(() => {
    if (!isCoolingDown) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [availableAtMs, isCoolingDown]);

  return { remainingSec, isCoolingDown };
}
