import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SEC_PER_HOUR = 3600;
const SEC_PER_DAY = 86_400;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function useCountdown(expiresAt: string) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const expiresMs = new Date(expiresAt).getTime();
  const remainingMs = Math.max(0, expiresMs - now);
  const isExpired = remainingMs <= 0;

  function formatRemaining(): string {
    const totalSeconds = Math.ceil(remainingMs / 1000);

    // Длинный TTL (§G1: до 72 ч) в формате «52:14:03» нечитаем.
    if (totalSeconds >= SEC_PER_DAY) {
      return t('sting.ttlCountdownDaysHours', {
        days: Math.floor(totalSeconds / SEC_PER_DAY),
        hours: Math.floor((totalSeconds % SEC_PER_DAY) / SEC_PER_HOUR),
      });
    }

    const hours = Math.floor(totalSeconds / SEC_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SEC_PER_HOUR) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }

    return `${minutes}:${pad(seconds)}`;
  }

  return {
    remainingMs,
    remainingLabel: isExpired ? '0:00' : formatRemaining(),
    isExpired,
  };
}
