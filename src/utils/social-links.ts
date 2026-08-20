import type { SocialLinkKey, UserSocialLinks } from '@/src/types';
import { SOCIAL_LINK_KEYS } from '@/src/types';

export function normalizeUserSocialLinks(links?: UserSocialLinks | null): UserSocialLinks {
  return {
    instagram: links?.instagram ?? null,
    telegram: links?.telegram ?? null,
    tiktok: links?.tiktok ?? null,
    youtube: links?.youtube ?? null,
    website: links?.website ?? null,
  };
}

export function hasAnySocialLink(links: UserSocialLinks): boolean {
  return SOCIAL_LINK_KEYS.some((key) => Boolean(links[key]));
}

export function getActiveSocialLinks(links: UserSocialLinks): Array<{ key: SocialLinkKey; url: string }> {
  return SOCIAL_LINK_KEYS.flatMap((key) => {
    const url = links[key];
    return url ? [{ key, url }] : [];
  });
}
