import { Image } from 'expo-image';

import { SOCIAL_LINK_META } from '@/src/constants/social-links';
import type { SocialLinkKey } from '@/src/types';

type SocialLinkIconProps = {
  socialKey: SocialLinkKey;
  size?: number;
};

export function SocialLinkIcon({ socialKey, size = 20 }: SocialLinkIconProps) {
  const meta = SOCIAL_LINK_META[socialKey];

  if (meta.image) {
    return (
      <Image contentFit="contain" source={meta.image} style={{ width: size, height: size }} />
    );
  }

  const Icon = meta.icon;

  if (!Icon) {
    return null;
  }

  return <Icon color={meta.color} size={size} strokeWidth={2.2} />;
}
