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

export interface PublicUserProfile extends ProfileOverview {
  user: User;
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

export type OtpPurpose = 'register' | 'password_reset';

export type OtpChallengeStatus = 'otp_required' | 'otp_sent';

export interface OtpChallengeResponse {
  status: OtpChallengeStatus;
  email: string;
  purpose: OtpPurpose;
  expiresInSec: number;
  resendAvailableInSec: number;
}

export interface VerifyOtpInput {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

export interface ResendOtpInput {
  email: string;
  purpose: OtpPurpose;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
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

/** Стадия кластера (§G13): «сота» (соло) или полноценный улей. */
export type HiveStage = 'seed' | 'hive';

/** Участник улья для аватаров на карте/в ленте без запроса деталей (§G13). */
export interface HiveContributor {
  userId: UUID;
  username: string;
  avatarUrl: string | null;
}

export interface Hive {
  id: UUID;
  center: GeoPoint;
  radiusM: number;
  activeStingsCount: number;
  /** Счётчик активации с капом на автора (§G13). Может отсутствовать на старом backend. */
  activationCount?: number;
  /** Уникальные авторы активных жал кластера (§G13). */
  contributorsCount?: number;
  /** Стадия кластера (§G13). Отсутствие поля — старый backend, стадия выводится из счётчиков. */
  stage?: HiveStage;
  /** До 5 участников по времени последней публикации (§G13). */
  topContributors?: HiveContributor[];
  createdAt: string;
  updatedAt: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** Схема (дороги) или спутник. Нативный `hybrid` даёт снимок с подписями улиц. */
export type HiveMapType = 'standard' | 'satellite';

export interface SavedMapPlace {
  id: UUID;
  name: string;
  region: MapRegion;
  createdAt: string;
}

export const SAVED_MAP_PLACE_NAME_MAX_LENGTH = 60;
export const SAVED_MAP_PLACES_MAX = 30;

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

export interface StingsPage {
  stings: Sting[];
  nextCursor: string | null;
}

export interface UserHiveSummary extends Hive {
  userStingsCount: number;
}

export interface UserHivesPage {
  hives: UserHiveSummary[];
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
