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

export function withInstagramVisibility(
  links: UserSocialLinks,
  instagramLinksAllowed: boolean,
): UserSocialLinks {
  if (instagramLinksAllowed) {
    return links;
  }

  return { ...links, instagram: null };
}

export function editableSocialLinkKeys(instagramLinksAllowed: boolean): SocialLinkKey[] {
  if (instagramLinksAllowed) {
    return [...SOCIAL_LINK_KEYS];
  }

  return SOCIAL_LINK_KEYS.filter((key) => key !== 'instagram');
}

export function hasAnySocialLink(links: UserSocialLinks): boolean {
  return SOCIAL_LINK_KEYS.some((key) => Boolean(links[key]));
}

export function getActiveSocialLinks(
  links: UserSocialLinks,
): Array<{ key: SocialLinkKey; url: string }> {
  return SOCIAL_LINK_KEYS.flatMap((key) => {
    const url = links[key];
    return url ? [{ key, url }] : [];
  });
}
