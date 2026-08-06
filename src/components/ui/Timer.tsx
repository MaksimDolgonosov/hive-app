import { Text, type TextProps } from 'react-native';

import { useCountdown } from '@/src/hooks/useCountdown';

type TimerProps = TextProps & {
  expiresAt: string;
  expiredLabel?: string;
};

export function Timer({ expiresAt, expiredLabel = '0:00', ...textProps }: TimerProps) {
  const { remainingLabel, isExpired } = useCountdown(expiresAt);

  return <Text {...textProps}>{isExpired ? expiredLabel : remainingLabel}</Text>;
}
