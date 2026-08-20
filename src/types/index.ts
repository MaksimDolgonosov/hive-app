export type UUID = string;

export const SOCIAL_LINK_KEYS = ['instagram', 'telegram', 'tiktok', 'youtube', 'website'] as const;

export type SocialLinkKey = (typeof SOCIAL_LINK_KEYS)[number];

export interface UserSocialLinks {
  instagram: string | null;
  telegram: string | null;
  tiktok: string | null;
  youtube: string | null;
  website: string | null;
}

export const EMPTY_SOCIAL_LINKS: UserSocialLinks = {
  instagram: null,
  telegram: null,
  tiktok: null,
  youtube: null,
  website: null,
};

export const PROFILE_BIO_MAX_LENGTH = 280;
export const PROFILE_SOCIAL_LINK_MAX_LENGTH = 200;

export interface User {
  id: UUID;
  username: string;
  avatarUrl: string | null;
  bio?: string | null;
  socialLinks?: UserSocialLinks;
  createdAt: string;
}

export interface UpdateProfileInput {
  bio?: string | null;
  socialLinks?: Partial<UserSocialLinks> | null;
}

export interface ProfileStats {
  photos: number;
  hives: number;
  likes: number;
}

export interface ProfileOverview {
  stats: ProfileStats;
  recentPhotos: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Sting {
  id: UUID;
  authorId: UUID;
  authorUsername?: string;
  authorAvatarUrl?: string | null;
  imageUrl: string;
  thumbnailUrl: string;
  location: GeoPoint;
  hiveId: UUID | null;
  createdAt: string;
  expiresAt: string;
  reactionsCount: number;
  /** Текстовый комментарий автора (опционально). */
  comment?: string | null;
  /** Поставил ли текущий пользователь like (есть в GET /stings/:id и POST /reactions). */
  hasLiked?: boolean;
}

export interface Hive {
  id: UUID;
  center: GeoPoint;
  radiusM: number;
  activeStingsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface StingsNearbyResponse {
  stings: Sting[];
  hives: Hive[];
}

export interface HiveDetailResponse {
  hive: Hive;
  stings: Sting[];
}

export interface HiveStingsPageResponse {
  stings: Sting[];
  nextCursor: string | null;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
  }
}
