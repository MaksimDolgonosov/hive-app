import { useEffect, useState } from 'react';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatRemaining(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${minutes}:${pad(seconds)}`;
}

export function useCountdown(expiresAt: string) {
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

  return {
    remainingMs,
    remainingLabel: isExpired ? '0:00' : formatRemaining(remainingMs),
    isExpired,
  };
}
