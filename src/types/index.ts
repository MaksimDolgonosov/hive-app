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

/**
 * Тип аккаунта (§G11). Неизвестное значение трактуется как `personal`
 * — см. `resolveAccountType`.
 */
export type AccountType = 'personal' | 'partner' | 'official';

export interface User {
  id: UUID;
  username: string;
  email?: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  socialLinks?: UserSocialLinks;
  accountType?: AccountType;
  createdAt: string;
}

/** Серверные настройки приватности (§G2, §G9). Живут только в React Query. */
export interface UserPrivacySettings {
  allowEcho: boolean;
  allowSharing: boolean;
}

export interface UpdateProfileInput {
  bio?: string | null;
  socialLinks?: Partial<UserSocialLinks> | null;
}

export interface ProfileStats {
  photos: number;
  hives: number;
  likes: number;
  /** Число наград (§G5). Может отсутствовать на старом backend. */
  awards?: number;
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
  /** Тип аккаунта автора для бейджа (§G11). */
  authorAccountType?: AccountType;
  imageUrl: string;
  thumbnailUrl: string;
  location: GeoPoint;
  hiveId: UUID | null;
  createdAt: string;
  expiresAt: string;
  reactionsCount: number;
  /** Текстовый комментарий автора (опционально). */
  comment?: string | null;
  /** Публичная ссылка для шаринга (§G9). `null` — автор запретил шаринг. */
  shareUrl?: string | null;
  /** Поставил ли текущий пользователь like (есть в GET /stings/:id и POST /reactions). */
  hasLiked?: boolean;
  /** Место, в радиусе которого снято жало (§G15). */
  placeId?: UUID | null;
}

/** Стадия кластера (§G13): «сота» (соло) или полноценный улей. */
export type HiveStage = 'seed' | 'hive';

/** Участник улья для аватаров на карте/в ленте без запроса деталей (§G13). */
export interface HiveContributor {
  userId: UUID;
  username: string;
  avatarUrl: string | null;
}

export type PlaceCategory = 'cafe' | 'bar' | 'restaurant' | 'other';
export type PlaceStatus = 'draft' | 'live' | 'paused' | 'suspended';
export type PlacePauseReason = 'owner' | 'cover_missing' | 'reports' | null;
export type PlaceMediaKind = 'cover' | 'gallery';
export type PlaceMediaSource = 'library' | 'camera';
export type PlaceReportReason = 'not_a_place' | 'wrong_location' | 'stolen_photos' | 'spam' | 'other';

export interface PlaceMedia {
  id: UUID;
  placeId: UUID;
  kind: PlaceMediaKind;
  source: PlaceMediaSource;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  sortOrder: number;
  moderation: 'approved' | 'rejected';
  rejectCode: 'quality' | 'not_this_place' | 'people_sensitive' | 'stolen' | 'other' | null;
  createdAt: string;
}

/** Публичный пин места. В выдаче карты только `live`. */
export interface PlaceSummary {
  id: UUID;
  name: string;
  category: PlaceCategory;
  center: GeoPoint;
  radiusM: number;
  coverThumbnailUrl: string | null;
  hiveId: UUID | null;
  hiveStage: HiveStage | null;
  activeGuestStingsCount: number;
  status: 'live';
}

export interface Place {
  id: UUID;
  ownerId: UUID;
  name: string;
  category: PlaceCategory;
  description: string | null;
  address: {
    formatted: string;
    city: string | null;
    country: string | null;
  };
  center: GeoPoint;
  radiusM: number;
  cover: PlaceMedia | null;
  gallery: PlaceMedia[];
  socialLinks: UserSocialLinks;
  hiveId: UUID | null;
  hiveStage: HiveStage | null;
  activeGuestStingsCount: number;
  status: PlaceStatus;
  pauseReason: PlacePauseReason;
  verifiedAt: string | null;
  phone: string | null;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerApplication {
  id: UUID;
  userId: UUID;
  brandName: string;
  category: PlaceCategory;
  address: {
    formatted: string;
    city: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
    source: 'declared' | 'onsite' | 'manual_admin';
  };
  phone: string | null;
  contactEmail: string;
  listingUrls: {
    instagram: string | null;
    website: string | null;
    ymaps: string | null;
    twogis: string | null;
  };
  onsite: {
    verifiedAt: string;
    lat: number;
    lng: number;
    accuracyM: number;
    distanceToAddressM: number;
  } | null;
  status: 'draft' | 'published';
  placeId: UUID | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
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
  /** Привязка к месту заведения (§G15). Старые клиенты поле игнорируют. */
  placeId?: UUID | null;
  place?: PlaceSummary | null;
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

/** Эфемерный фильтр маркеров карты (`RN_FRONTEND_TZ.md` §9). */
export type MapFilter = 'all' | 'fresh' | 'hives' | 'expiring';

/**
 * Агрегированный след истёкших жал (§G2). Без фото, без автора и без точных
 * координат: центр — это центр H3-ячейки, а не место съёмки.
 */
export interface StingEchoCell {
  cellId: string;
  center: GeoPoint;
  count: number;
  lastSeenAt: string;
}

export interface StingsNearbyResponse {
  stings: Sting[];
  hives: Hive[];
  /** Live-места с обложкой (§G15). По умолчанию сервер их отдаёт. */
  places?: PlaceSummary[];
  /** Приходит только при `includeEchoes=true` (§G2). */
  echoes?: StingEchoCell[];
  /** Область, которую сервер фактически применил (§G3). */
  appliedBounds?: MapBounds;
  /** Сервер расширил область, чтобы набрать `minResults` (§G3). */
  expanded?: boolean;
  appliedRadiusM?: number;
}

export interface NearestStingsResponse {
  stings: Sting[];
  /** `null` — активных жал нет вовсе (§G3). */
  distanceM: number | null;
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

// ---------------------------------------------------------------------------
// Зоны и TTL (§G1) / вейтлист (§G8.3)
// ---------------------------------------------------------------------------

export type ZoneStatus = 'open' | 'waitlist';

export interface Zone {
  id: string;
  status: ZoneStatus;
  /** Фактический TTL, который применится к публикации в этой зоне. */
  ttlSec: number;
  activeStings: number;
  /** В зоне не было ни одного жала за всё время (§G5). */
  isFirstEver: boolean;
  /** Только при `status: 'waitlist'` (§G8.3). */
  waitlistCount?: number;
  threshold?: number;
}

export interface WaitlistResponse {
  zoneId: string;
  status: ZoneStatus;
  currentCount: number;
  threshold: number;
}

// ---------------------------------------------------------------------------
// Награды (§G5, §G13)
// ---------------------------------------------------------------------------

export type AwardType = 'zone_first' | 'zone_revival' | 'hive_ignited' | 'hive_founder';

export interface Award {
  id?: UUID;
  type: AwardType;
  zoneId: string;
  stingId?: UUID;
  hiveId?: UUID;
  center?: GeoPoint;
  createdAt: string;
}

export interface AwardsPage {
  awards: Award[];
  nextCursor: string | null;
}

/** Ответ `POST /stings` (§G1, §G5). */
export interface PublishStingResponse {
  sting: Sting;
  ttlSec?: number;
  zone?: Pick<Zone, 'id' | 'status' | 'ttlSec'>;
  awards?: Award[];
}

// ---------------------------------------------------------------------------
// Обзор карты на дальнем зуме (§G4)
// ---------------------------------------------------------------------------

export interface MapOverviewCluster {
  cellId: string;
  center: GeoPoint;
  radiusM: number;
  activeStingsCount: number;
  activeHivesCount: number;
  /** Название из реверс-геокодинга; клиент обязан выдержать `null`. */
  label: string | null;
}

export interface MapOverviewResponse {
  clusters: MapOverviewCluster[];
  resolution: number;
}

// ---------------------------------------------------------------------------
// Кампании и «час улья» (§G7)
// ---------------------------------------------------------------------------

export type CampaignKind = 'hive_hour' | 'event';

export interface Campaign {
  id: UUID;
  kind: CampaignKind;
  /** Ключ i18n для заголовка, напр. `campaign.hiveHour`. */
  i18nKey: string;
  startsAt: string;
  endsAt: string;
  ttlBonusSec: number;
  participantsCount?: number;
}

export interface ActiveCampaignsResponse {
  campaigns: Campaign[];
}

// ---------------------------------------------------------------------------
// Инвайты (§G8)
// ---------------------------------------------------------------------------

export interface Invite {
  code: string;
  url?: string;
  usesLimit: number;
  usesCount: number;
  createdAt: string;
  expiresAt: string;
}

export interface CreatedInvite {
  code: string;
  url: string;
  usesLeft: number;
  expiresAt: string;
}

export interface MyInvitesResponse {
  invites: Invite[];
  acceptedCount: number;
  usesLeft: number;
}

export interface PublicInviteResponse {
  valid: boolean;
  ownerUsername: string | null;
  zoneCenter: GeoPoint | null;
}

// ---------------------------------------------------------------------------
// Push-уведомления (§G10)
// ---------------------------------------------------------------------------

export interface NotificationSettings {
  reactions: boolean;
  nearbyActivity: boolean;
  campaigns: boolean;
  expiringSting: boolean;
  inviteAccepted: boolean;
}

export type NotificationSettingKey = keyof NotificationSettings;

export interface RegisterDeviceInput {
  expoPushToken: string;
  platform: 'ios' | 'android';
  deviceId: string;
  locale: string;
  timezone: string;
}

// ---------------------------------------------------------------------------
// Аналитика роста (§G12)
// ---------------------------------------------------------------------------

export type AnalyticsEventName =
  | 'app_open'
  | 'session_start'
  | 'map_empty_shown'
  | 'empty_cta_tap'
  | 'nearest_sting_opened'
  | 'first_sting_published'
  | 'sting_published'
  | 'invite_created'
  | 'share_opened'
  | 'push_opened'
  | 'campaign_banner_shown'
  | 'waitlist_submitted'
  | 'seed_marker_tap'
  | 'partner_apply_started'
  | 'partner_onsite_succeeded'
  | 'partner_application_submitted'
  | 'place_cover_uploaded'
  | 'place_went_live'
  | 'place_card_opened'
  | 'place_deeplink_opened'
  | 'place_report_submitted'
  | 'place_seed_cta_tap';

/**
 * Событие аналитики. В `props` запрещены персональные данные: email, точные
 * координаты пользователя, `authorId` (§G12). Гео — только `zoneId`.
 */
export interface AnalyticsEvent {
  name: AnalyticsEventName;
  occurredAt: string;
  zoneId?: string;
  props?: Record<string, string | number | boolean | null>;
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
