import { Globe, Link2, MessageCircle, Play, Share2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { SocialLinkKey } from '@/src/types';

type SocialLinkLabelKey =
  | 'profile.socialInstagram'
  | 'profile.socialTelegram'
  | 'profile.socialTiktok'
  | 'profile.socialYoutube'
  | 'profile.socialWebsite';

export const SOCIAL_LINK_META: Record<SocialLinkKey, { icon: LucideIcon; color: string; labelKey: SocialLinkLabelKey }> =
  {
    instagram: { icon: Share2, color: '#E1306C', labelKey: 'profile.socialInstagram' },
    telegram: { icon: MessageCircle, color: '#229ED9', labelKey: 'profile.socialTelegram' },
    tiktok: { icon: Link2, color: '#010101', labelKey: 'profile.socialTiktok' },
    youtube: { icon: Play, color: '#FF0000', labelKey: 'profile.socialYoutube' },
    website: { icon: Globe, color: '#F5A623', labelKey: 'profile.socialWebsite' },
  };
