import type { ImageSource } from 'expo-image';
import { Globe, type LucideIcon } from 'lucide-react-native';

import type { SocialLinkKey } from '@/src/types';

type SocialLinkLabelKey =
  | 'profile.socialInstagram'
  | 'profile.socialTelegram'
  | 'profile.socialTiktok'
  | 'profile.socialYoutube'
  | 'profile.socialWebsite';

type SocialLinkMeta = {
  color: string;
  labelKey: SocialLinkLabelKey;
  image?: ImageSource;
  icon?: LucideIcon;
};

export const SOCIAL_LINK_META: Record<SocialLinkKey, SocialLinkMeta> = {
  instagram: {
    image: require('../../assets/icons/socials/instagram.png') as ImageSource,
    color: '#E1306C',
    labelKey: 'profile.socialInstagram',
  },
  telegram: {
    image: require('../../assets/icons/socials/telegram.png') as ImageSource,
    color: '#229ED9',
    labelKey: 'profile.socialTelegram',
  },
  tiktok: {
    image: require('../../assets/icons/socials/tik-tok.png') as ImageSource,
    color: '#010101',
    labelKey: 'profile.socialTiktok',
  },
  youtube: {
    image: require('../../assets/icons/socials/youtube.png') as ImageSource,
    color: '#FF0000',
    labelKey: 'profile.socialYoutube',
  },
  website: { icon: Globe, color: '#FFB800', labelKey: 'profile.socialWebsite' },
};
