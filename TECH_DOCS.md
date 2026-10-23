# Hive — Техническая документация фронтенда

Единый документ клиента. Сюда собраны прежние отдельные файлы:

| Часть | Было | О чём |
|---|---|---|
| 1 | `TECH_DOCS.md` | Архитектура, модели, API, WebSocket |
| 2 | `RN_FRONTEND_TZ.md` | ТЗ на разработку frontend |
| 3 | `RN_GROWTH_TZ.md` | Привлечение пользователей, клиент |
| 4 | `PLACE_PARTNER_TZ.md` | Места заведений и самопубликация партнёров |
| 5 | `google_therms.md` | Сверка с требованиями Google Play |

Отдельными файлами остаются `BACKEND_GROWTH_TZ.md`, `EXPO_SDK_55_MIGRATION.md`, `YANDEX_MAPKIT_MIGRATION.md`, `openapi.yaml` и `legal/`.

Перекрёстные ссылки вида «часть „ТЗ frontend“ §8» указывают на разделы этого файла.

## Состав

1. [Часть 1. Архитектура, модели и API](#часть-1-архитектура-модели-и-api)
2. [Часть 2. ТЗ на разработку frontend](#часть-2-тз-на-разработку-frontend)
3. [Часть 3. Привлечение пользователей (клиент)](#часть-3-привлечение-пользователей-клиент)
4. [Часть 4. Места заведений и партнёры](#часть-4-места-заведений-и-партнёры)
5. [Часть 5. Публикация в Google Play](#часть-5-публикация-в-google-play)


---

# Часть 1. Архитектура, модели и API

# Sting App — Техническая документация

Версия: 0.1 (draft)
Аудитория: команда разработки (frontend RN + backend)

---

## Содержание

1. [Архитектура и модули](#1-архитектура-и-модули)
2. [Модели данных](#2-модели-данных)
3. [API контракты](#3-api-контракты)
   - [3.1 Auth](#31-auth)
   - [3.2 Stings](#32-stings)
   - [3.3 Hives](#33-hives)
   - [3.4 Places](#34-places)
   - [3.5 Partner applications](#35-partner-applications)
4. [WebSocket](#4-websocket)
5. [Общие соглашения](#5-общие-соглашения)

---

## 1. Архитектура и модули

### 1.1 `app/` — Expo Router (file-based routing)

Отвечает только за композицию экранов и навигацию. Не содержит бизнес-логики — экраны импортируют хуки/компоненты из `src/` и просто их компонуют.

| Путь | Назначение |
|---|---|
| `app/_layout.tsx` | Корневой layout: подключение провайдеров (React Query, Zustand hydration, тема), auth-guard (редирект на `(onboarding)` или `(tabs)` в зависимости от состояния `authStore`) |
| `app/(tabs)/_layout.tsx` | Таб-бар с тремя вкладками: Карта / Рядом / Профиль |
| `app/(tabs)/index.tsx` | Экран карты — рендерит `MapContainer`, подписан на `mapStore` и `useStingsNearby` |
| `app/(tabs)/nearby.tsx` | Лента ближайших жал списком (альтернатива карте для плохого GPS/предпочтений) |
| `app/(tabs)/profile.tsx` | Профиль, настройки, выход. Пункт «Для заведений» открывает список мест |
| `app/(modals)/partner/places.tsx` | Список мест владельца и «Создать место» |
| `app/(modals)/partner/apply.tsx` | Заявка: название, категория, текущий GPS, email. Телефон и сайт необязательны |
| `app/(modals)/partner/place/edit.tsx` | Редактор места: обложка, имя, описание, соцсети, пауза, удаление черновика |
| `app/(modals)/place/[id].tsx` | Публичная карточка места |
| `app/(modals)/_layout.tsx` | Stack-навигатор с `presentation: 'modal'` для camera/preview/sting-detail и экранов места |
| `app/(modals)/camera.tsx` | Полноэкранная камера |
| `app/(modals)/preview.tsx` | Просмотр снятого фото перед публикацией + подтверждение |
| `app/(modals)/sting/[id].tsx` | Детальный просмотр одного жала по id |
| `app/(onboarding)/*` | Линейный флоу из 3 шагов, показывается один раз (флаг в `authStore`/AsyncStorage) |

**Auth-guard**: логика в корневом `_layout.tsx` — читает `authStore.status` (`idle | authenticated | unauthenticated`) и вызывает `router.replace()` соответственно. Экраны `(tabs)` и `(modals)` не должны сами проверять авторизацию.

### 1.2 `src/api/` — HTTP/WS клиент

| Файл | Назначение |
|---|---|
| `client.ts` | Единственный `axios.create()` инстанс. Interceptor на request — подставляет `Authorization: Bearer <accessToken>` из `authStore`. Interceptor на response 401 — пытается `refreshToken`, при неудаче — logout. Базовый URL из `app.json` → `extra.apiUrl` |
| `auth.ts` | Обёртки над эндпоинтами `/auth/*` (см. раздел 3.1) |
| `stings.ts` | Обёртки над `/stings/*` (см. 3.2) |
| `hives.ts` | Обёртки над `/hives/*` (см. 3.3) |
| `websocket.ts` | Синглтон-менеджер сокета: `connect()`, `disconnect()`, `subscribe(event, cb)`, авто-reconnect с экспоненциальным backoff, ре-подписка на регион карты при reconnect |

Каждый файл экспортирует только async-функции, возвращающие уже типизированные данные (не `AxiosResponse`) — форма ответа описана в разделе 3.

### 1.3 `src/components/`

| Модуль | Назначение |
|---|---|
| `map/MapContainer.tsx` | Обёртка над Yandex MapKit (`HiveMapView`). Держит `region`, дебаунсит изменение региона (300мс) и триггерит `useStingsNearby` с новыми bounds. Рендерит `StingMarker`/`HiveCircle` из полученных данных |
| `map/StingMarker.tsx` | Одиночный пин. Цвет/прозрачность зависят от `expiresAt` (см. `useCountdown`) |
| `map/HiveCircle.tsx` | Кластерный маркер. Размер/пульсация зависят от `photoCount`. При тапе — открывает `HiveBottomSheet` через `mapStore.selectedHiveId` |
| `camera/CameraView.tsx` | Обёртка над `expo-camera`. Не содержит UI кнопок — только видоискатель + permission-стейт |
| `camera/CaptureButton.tsx` | Кнопка затвора. На `onPress` — haptic (`utils/haptics.ts`) + вызывает `useCamera().capture()` |
| `ui/Timer.tsx` | Презентационный компонент обратного отсчёта, принимает `expiresAt`, сам ничего не запрашивает (использует `useCountdown` внутри) |
| `ui/Avatar.tsx` | Аватар пользователя с фоллбеком на инициалы |
| `ui/HiveBottomSheet.tsx` | Bottom sheet со списком фото улья. Данные — через `useQuery(['hive', id])` |
| `feed/NearbyCard.tsx` | Карточка для `nearby.tsx` — превью, дистанция, таймер |

### 1.4 `src/hooks/`

| Хук | Назначение |
|---|---|
| `useLocation.ts` | Обёртка над `expo-location`. Возвращает `{ coords, accuracy, status }`, следит за permission, при `accuracy > 50м` возвращает флаг `isLowAccuracy` для UI-предупреждения перед публикацией |
| `useStingsNearby.ts` | React Query hook: `useQuery(['stings', bounds], () => stings.getNearby(bounds))`. `staleTime` короткий (30с), т.к. данные "живые"; инвалидируется также WS-событием `sting:created`/`sting:expired` |
| `useCamera.ts` | Инкапсулирует запрос permissions, вызов `expo-camera`, запись временного файла, передачу его в `cameraStore` |
| `useCountdown.ts` | `(expiresAt: string) => { remainingMs, remainingLabel, isExpired }`. Обновляется через `setInterval` 1 раз/сек, останавливается при `isExpired` |

### 1.5 `src/stores/` (Zustand)

| Store | Состояние |
|---|---|
| `authStore.ts` | `user`, `accessToken`, `refreshToken`, `status`, `hasCompletedOnboarding`. Персистится в `expo-secure-store` (токены) / AsyncStorage (флаг онбординга) |
| `preferencesStore.ts` | `themePreference`: `light` \| `dark` \| `system`. По умолчанию `light`. `system` вызывает `Appearance.setColorScheme(null)` и слушает смену темы телефона. В палитры уходит уже разрешённый `light` или `dark` |
| `mapStore.ts` | `region`, `selectedHiveId`, `selectedStingId` — чисто UI-состояние карты, не серверные данные (те — в React Query кэше) |
| `cameraStore.ts` | `capturedUri`, `captureCoords`, `captureAccuracy` — временное состояние между `camera.tsx` и `preview.tsx`, очищается после публикации или отмены |

**Принцип разделения:** серверные данные (жала, ульи, профиль) живут в React Query. Zustand — только для эфемерного клиентского UI-состояния и авторизации. Это исключает дублирование источника истины.

### 1.6 `src/utils/`

| Файл | Назначение |
|---|---|
| `geo.ts` | `haversineDistance(a, b)`, `isWithinRadius(point, center, radiusM)` — используется для клиентской проверки перед отправкой (сервер всегда перепроверяет) |
| `validation.ts` | Клиентские проверки перед аплоадом: свежесть EXIF-таймстампа фото относительно текущего момента (защита от re-upload старых фото), проверка что файл пришёл из `capturedUri` камеры, а не из document picker. **Это только UX-предупреждение** — авторитетная проверка анти-спуфинга обязана быть на сервере (см. 5.3) |
| `haptics.ts` | Именованные паттерны (`impactCapture`, `notifyPublishSuccess`) поверх `expo-haptics`, чтобы не разбрасывать сырые вызовы по компонентам |

### 1.7 `src/types/index.ts`

Общие типы, зеркалящие серверные DTO из раздела 2 (`Sting`, `Hive`, `User`, `AuthTokens`, пагинированные обёртки). Рекомендуется генерировать их из OpenAPI-схемы бэкенда, а не поддерживать вручную вторым источником истины.

---

## 2. Модели данных

```ts
type UUID = string; // v4

interface User {
  id: UUID;
  username: string;
  avatarUrl: string | null;
  createdAt: string; // ISO 8601
}

interface Sting {
  id: UUID;
  authorId: UUID;
  authorUsername: string;
  authorAvatarUrl: string | null;
  authorAccountType: 'personal' | 'partner' | 'official';
  imageUrl: string;
  thumbnailUrl: string;
  location: {
    lat: number;
    lng: number;
  };
  hiveId: UUID | null;      // null, если пока одиночное (для seed при includeSeeds=false тоже null в nearby)
  createdAt: string;        // ISO 8601
  expiresAt: string;        // ISO 8601, TTL зоны (+ бонусы кампании/улья, ≤ 72ч)
  reactionsCount: number;
  comment: string | null;
  shareUrl: string | null;
  hasLiked?: boolean;       // для авторизованных GET-запросов
}

interface Hive {
  id: UUID;
  center: { lat: number; lng: number };
  radiusM: number;
  activeStingsCount: number;
  activationCount: number;
  contributorsCount: number;
  stage: 'seed' | 'hive';
  topContributors: Array<{ userId: UUID; username: string; avatarUrl: string | null }>;
  createdAt: string;
  updatedAt: string;
}

interface AuthTokens {
  accessToken: string;   // JWT, TTL ~15 мин
  refreshToken: string;  // TTL ~30 дней
  expiresAt: string;     // ISO 8601, срок действия accessToken
}
```

---

## 3. API контракты

Базовый префикс: `/api/v1`. Формат: JSON. Аутентификация — `Authorization: Bearer <accessToken>` для всех эндпоинтов, кроме `/auth/register`, `/auth/otp/verify`, `/auth/otp/resend`, `/auth/login`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/refresh`.

Единый формат ошибки:

```json
{
  "error": {
    "code": "STING_LOCATION_MISMATCH",
    "message": "Координаты фото не совпадают с текущим местоположением",
    "details": {}
  }
}
```

### 3.1 Auth

Регистрация по email — двухшаговая: `register` создаёт пользователя `pending` и шлёт 6-значный OTP (TTL 10 минут, max 5 попыток, cooldown resend 60 с). Токены выдаются только после `otp/verify`. Сброс пароля — вариант A (один запрос `password/reset` с email + code + newPassword); после успеха все refresh-токены отзываются и выдаётся новая сессия.

#### `POST /auth/register`
```json
// Request
{ "email": "user@example.com", "password": "string", "username": "string" }

// Response 201
{
  "status": "otp_required",
  "email": "user@example.com",
  "purpose": "register",
  "expiresInSec": 600,
  "resendAvailableInSec": 60
}

// Response 409 — email уже подтверждён или username занят
{ "error": { "code": "USER_ALREADY_EXISTS", "message": "..." } }
```

Если email есть, но `emailVerified=false`, пароль/username обновляются и высылается новый код (токены не выдаются).

#### `POST /auth/otp/verify`
```json
// Request
{ "email": "user@example.com", "code": "123456", "purpose": "register" }

// Response 200
{ "user": User, "tokens": AuthTokens }

// Response 400
{ "error": { "code": "OTP_INVALID" | "OTP_EXPIRED" | "OTP_MAX_ATTEMPTS", "message": "..." } }

// Response 404
{ "error": { "code": "OTP_NOT_FOUND", "message": "..." } }
```

Побочные эффекты: `emailVerified=true`, `status=active`.

#### `POST /auth/otp/resend`
```json
// Request
{ "email": "user@example.com", "purpose": "register" | "password_reset" }

// Response 200
{
  "status": "otp_sent",
  "email": "user@example.com",
  "purpose": "register",
  "expiresInSec": 600,
  "resendAvailableInSec": 60
}

// Response 429 — слишком рано или превышен лимит отправок
{ "error": { "code": "OTP_RESEND_COOLDOWN" | "OTP_RATE_LIMITED", "message": "...", "details": { "retryAfterSec": 42 } } }
```

Для `purpose=password_reset`: даже если email не найден, возвращается тот же успешный ответ (anti-enumeration).

#### `POST /auth/login`
```json
// Request
{ "email": "user@example.com", "password": "string" }

// Response 200
{ "user": User, "tokens": AuthTokens }

// Response 401
{ "error": { "code": "INVALID_CREDENTIALS", "message": "..." } }

// Response 403 — аккаунт не подтверждён; клиент открывает экран OTP и может вызвать /auth/otp/resend
{
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Email is not verified",
    "details": { "email": "user@example.com", "purpose": "register" }
  }
}
```

#### `POST /auth/password/forgot`
```json
// Request
{ "email": "user@example.com" }

// Response 200 — всегда, в том числе если email не существует (anti-enumeration)
{
  "status": "otp_sent",
  "email": "user@example.com",
  "purpose": "password_reset",
  "expiresInSec": 600,
  "resendAvailableInSec": 60
}
```

#### `POST /auth/password/reset`
```json
// Request
{ "email": "user@example.com", "code": "123456", "newPassword": "string" }

// Response 200
{ "user": User, "tokens": AuthTokens }
```

После успеха старый пароль больше не работает, все refresh-токены пользователя отозваны.

#### `POST /auth/refresh`
```json
// Request
{ "refreshToken": "string" }

// Response 200
{ "tokens": AuthTokens }

// Response 401 — refresh истёк или отозван, клиент обязан разлогинить пользователя
```

#### `POST /auth/logout`
```json
// Request
{ "refreshToken": "string" }

// Response 204
```

#### `GET /auth/me/stats`

Активная статистика профиля (только неистёкшие жala, TTL 4 часа).

```json
// Response 200
{
  "stats": {
    "photos": 3,
    "hives": 1,
    "likes": 12
  },
  "recentPhotos": ["https://.../thumb.jpg"]
}
```

#### `GET /auth/me`
```json
// Response 200
{ "user": User }
```

#### `DELETE /auth/me`

Удаляет аккаунт текущего пользователя и связанные данные: профиль, аватар, сессии, OTP, опубликованные фото и реакции. После успеха клиент обязан очистить локальную сессию.

```json
// Request — пустое тело, Authorization: Bearer <accessToken>

// Response 204
```

---

### 3.2 Stings

#### `GET /stings/nearby`
Запрос жал в пределах видимой области карты. Возвращает только **активные** (не истёкшие) жала; истёкшие сервер не отдаёт вовсе.

```
Query params:
  swLat, swLng, neLat, neLng   — bounding box видимой карты (обязательные)
  includeEchoes?: boolean      — default false; ячейки эха истёкших жал
  includeSeeds?: boolean       — default false; seed-кластеры в hives[]
  includePlaces?: boolean      — default true; тихие live-места в places[]
  minResults?: number          — 0..50, расширять bbox пока не наберётся столько жал
  maxRadiusM?: number          — предел расширения, default 50000
```

```json
// Response 200
{
  "stings": Sting[],
  "hives": Hive[],
  "places": PlaceSummary[],
  "echoes": [{ "cellId": "8911aa...", "center": { "lat": 0, "lng": 0 }, "count": 4, "lastSeenAt": "..." }],
  "appliedBounds": { "swLat": 0, "swLng": 0, "neLat": 0, "neLng": 0 },
  "expanded": false,
  "appliedRadiusM": 1200
}
```

Без новых параметров поведение прежнее: `expanded: false`, `appliedBounds` = запрошенный bbox, `hives` только `stage: 'hive'`. При `includeSeeds=false` жала seed-кластеров приходят в `stings[]` с `hiveId: null`, чтобы старый клиент их не прятал. `includePlaces` по умолчанию `true`: в `places[]` только live-места с обложкой. Старый клиент поле игнорирует. `viewportDensity` места не считает.

#### `GET /stings/nearest`
`lat`, `lng`, `limit` 1..10. `$geoNear`, max 300 км. `{ stings, distanceM }` (`distanceM` = null, если активных жал нет).

> Сервер сам решает кластеризацию: жала, попавшие в `hiveId`, не дублируются как отдельные точки на карте — клиент рендерит `HiveCircle` вместо набора `StingMarker`.

#### `POST /stings`
Публикация нового жала. **Только multipart** — фото передаётся файлом, не base64/URL.

```
Content-Type: multipart/form-data

fields:
  photo: File (jpeg)
  lat: number
  lng: number
  accuracy: number          // метры, точность GPS в момент съёмки
  capturedAt: string        // ISO 8601, клиентский таймстамп съёмки
```

```json
// Response 201
{
  "sting": Sting,
  "ttlSec": 86400,
  "zone": { "id": "8811aa...", "status": "open", "ttlSec": 86400 },
  "awards": [{ "type": "zone_first", "zoneId": "8811aa...", "createdAt": "..." }]
}
```

`awards` отсутствует, если наград нет. TTL фиксируется в `expiresAt` в момент публикации и больше не меняется.

// Response 422 — не прошла серверная анти-спуфинг проверка
{
  "error": {
    "code": "STING_VALIDATION_FAILED",
    "message": "Фото не прошло проверку подлинности",
    "details": { "reason": "EXIF_MISMATCH" }
  }
}

// Response 429 — rate limit (защита от спама публикаций)
{ "error": { "code": "RATE_LIMITED", "message": "Слишком много публикаций, попробуйте позже" } }
```

#### `GET /stings/:id`
```json
// Response 200
{ "sting": Sting }

// Response 404 — жало истекло и было удалено, либо не существует
{ "error": { "code": "STING_NOT_FOUND", "message": "..." } }
```

#### `DELETE /stings/:id`
Удаление собственного жала до истечения TTL. Только автор.

При успешном удалении backend:
1. Удаляет из storage оригинал и thumbnail (`deleteStingImages` — R2 `DeleteObject` или локальный файл).
2. Удаляет документ `Sting` и связанные реакции.
3. Пересчитывает улей / шлёт `sting:expired` и при необходимости `hive:updated` / `hive:dissolved`.

```
// Response 204
// Response 403 — попытка удалить чужое жало
```

#### `POST /stings/:id/reactions`

Toggle like для текущего пользователя: повторный запрос снимает реакцию.

```json
// Request
{ "type": "like" }

// Response 200
{ "reactionsCount": 14, "hasLiked": true }
```

`GET /stings/:id`, `GET /stings/nearby` и списки в hive возвращают `hasLiked` для текущего пользователя.

---

### 3.3 Hives

#### `GET /hives/:id`
```json
// Response 200
{
  "hive": Hive,
  "stings": Sting[]   // отсортированы по createdAt desc
}
```

#### `GET /hives/:id/stings`
Отдельный пагинированный эндпоинт — используется, если в улье может быть много фото и весь список получать сразу нецелесообразно.

```
Query params: cursor?: string, limit?: number (default 20, max 50)
```

```json
// Response 200
{
  "stings": Sting[],
  "nextCursor": "string | null"
}
```

`Sting.placeId` — место, в радиус которого попало гостевое жало. Партнёрское жало место не увеличивает `activeGuestStingsCount`. `Hive.placeId` и `Hive.place` (`PlaceSummary`) — если центр улья внутри live-места. Пауза, пропажа обложки и удаление черновика обнуляют эту связь, иначе сота продолжает показывать обложку скрытого места. Событие `hive:updated` несёт тот же summary.

---

### 3.4 Places

Публичный DTO не содержит телефон, on-site кадр и EXIF GPS. `verifiedAt` всегда `null`. Продуктовые правила — `часть «Места заведений»` v0.5.

```
GET    /places/me
GET    /places/:id
PATCH  /places/:id                         — name, description ≤280, category, phone, socialLinks
POST   /places/:id/pause                   — live→paused, Hive.placeId обнуляется
POST   /places/:id/resume                  — без обложки → PLACE_RESUME_NEEDS_COVER
DELETE /places/:id                         — только draft → 204, иначе 422 PLACE_NOT_DRAFT
POST   /places/:id/media                   — multipart photo, kind=cover|gallery
PATCH  /places/:id/media/order
DELETE /places/:id/media/:mediaId
GET    /places/:id/stings                  — includePartner default false
POST   /places/:id/reports
POST   /places/:id/media/:mediaId/reports
GET    /share/places/:id                   — live + cover, иначе 404
```

Центр места — GPS устройства в `POST /partner/applications/:id/submit` (`source: declared`). Партнёр его не двигает, текстового адреса нет. Обложка из `draft` переводит место в `live`. Короткая сторона ≥ 800, иначе `MEDIA_TOO_SMALL`. Медиа сразу `moderation=approved`. Клиент грузит и показывает только обложку: редактор места, иконка камеры как у аватара. Сервер ещё принимает `kind=gallery` (лимит 12) и порядок галереи, приложение эти вызовы не делает. Чужой центр ближе `PLACE_OVERLAP_MIN_M` (40) → `409 PLACE_OVERLAP`. В лимит 3 входят `live`, `paused` и `suspended`; черновик не считается.

`socialLinks` — те же ключи, что у профиля: `instagram`, `telegram`, `tiktok`, `youtube`, `website`. Пустая строка стирает ключ, `@username` сервер разворачивает в URL. Карточка рисует непустые ссылки чипами и текст описания.

`live` и `paused` владелец не удаляет. С карты `live` уходит через pause. `DELETE` стирает только черновик вместе с его медиа. Чужой `paused` отвечает урезанным `{ hidden: true }`. Чужой `suspended` — `404 PLACE_SUSPENDED`. `draft` видит только owner. Жалоба в клиенте — лист причин с «Отмена» и обработкой кнопки назад, не системный диалог из пяти кнопок.

### 3.5 Partner applications

```
POST   /partner/applications
GET    /partner/applications/me
PATCH  /partner/applications/:id
POST   /partner/applications/:id/onsite    — multipart, только камера
POST   /partner/applications/:id/submit
```

Одна активная draft-заявка на пользователя: повторный `POST` возвращает её. `submit` принимает `{ lat, lng }`, создаёт `Place` в `draft` с этим центром, ставит `accountType=partner` и публикует заявку. ИНН, геокодер, SMS, текстовый адрес и approve до публикации нет. `POST /onsite` в пути публикации не вызывается. Эндпоинт остаётся: accuracy хуже 50 м → `ONSITE_LOW_ACCURACY`; анти-спуфинг как у жала → `ONSITE_VALIDATION_FAILED`; типичный Software-тег галереи → `GALLERY_SOURCE`. Кадр on-site в API не отдаётся.

Админ (UI вне клиента): `POST /admin/places`, `POST /admin/places/:id/suspend|unsuspend|transfer|center`, `POST /admin/place-media/:id/review`, `POST /admin/place-reports/:id/resolve`. Удаление аккаунта прячет места, снимает публичные медиа и анонимизирует заявки; on-site хранится ~90 дней.

---

## 4. WebSocket

Подключение: `wss://<host>/ws?token=<accessToken>`. Один сокет на клиента, менеджер — `src/api/websocket.ts`.

После подключения клиент обязан отправить подписку на регион карты (сервер не шлёт события вне подписанной области — иначе трафик не масштабируется):

```json
// Client → Server
{
  "type": "subscribe:region",
  "payload": { "swLat": 0, "swLng": 0, "neLat": 0, "neLng": 0 }
}
```

Регион переподписывается при каждом значимом смещении карты (тот же дебаунс 300мс, что и у `useStingsNearby`).

### События сервера

| Event | Payload | Когда |
|---|---|---|
| `sting:created` | `{ sting: Sting }` | Новое жало опубликовано в подписанном регионе |
| `sting:expired` | `{ stingId: UUID, hiveId: UUID \| null }` | Жало истекло по TTL (сервер, не клиентский таймер — источник истины) |
| `hive:updated` | `{ hive: Hive }` | Изменились счётчики / `stage` (в т.ч. seed→hive). Отдельного события зажигания нет |
| `hive:dissolved` | `{ hiveId: UUID }` | В кластере осталось < 2 активных жал |
| `sting:reaction` | `{ stingId: UUID, reactionsCount: number }` | Изменился счётчик реакций на открытом сейчас `sting/[id]` |
| `campaign:started` | `{ campaign }` | Кампания стала активной в подписанном регионе |
| `campaign:ended` | `{ campaignId: UUID }` | Окно кампании закрылось |

Формат едино для всех событий:

```json
{ "type": "sting:created", "payload": { /* ... */ } }
```

**Интеграция с React Query:** обработчики в `websocket.ts` не хранят собственное состояние — они вызывают `queryClient.setQueryData` / `invalidateQueries` для ключей `['stings', bounds]` и `['hive', id]`, чтобы WS был единственным источником realtime-обновлений, а компоненты не подписывались на сокет напрямую.

### Client → Server (кроме подписки)

| Event | Payload | Назначение |
|---|---|---|
| `unsubscribe:region` | `{}` | Отправляется при уходе с экрана карты (фоновый режим) для экономии трафика |
| `ping` | `{}` | Keepalive раз в 25с; сервер обязан ответить `pong` в течение 5с, иначе клиент считает соединение мёртвым и переподключается |

---

## 5. Общие соглашения

### 5.1 Формат времени
Всегда ISO 8601 UTC (`2026-07-27T14:30:00.000Z`). Форматирование в локальное время — только на клиенте.

### 5.2 Пагинация
Курсорная (не offset-based) везде, где применимо — данные "живые" и постоянно меняются, offset даёт дубликаты/пропуски.

### 5.3 Анти-спуфинг публикации (сервер — источник истины)
Клиентские проверки в `utils/validation.ts` — это только немедленная обратная связь пользователю. Сервер обязан независимо:
- сверять `capturedAt` из запроса с временем получения запроса (окно допуска, например ±2 минуты);
- сверять `lat/lng` из запроса с точностью GPS (`accuracy`), отклонять при подозрительно идеальных координатах;
- по возможности сверять EXIF-метаданные исходного файла с заявленными координатами/временем.

Ни одна из этих проверок не должна приниматься "на веру" от клиента.

### 5.4 Идемпотентность публикации
`POST /stings` должен поддерживать заголовок `Idempotency-Key` (UUID, генерируется клиентом при старте публикации) — на случай повторной отправки при обрыве связи, чтобы не создавать дубликат жала.

### 5.5 Версионирование API
Префикс `/api/v1` фиксирован на MVP. Breaking changes — только через `/api/v2`, без изменения поведения `v1` до его вывода из эксплуатации.

---

## 6. Механики роста (контракты)

Источник истины — `BACKEND_GROWTH_TZ.md`. Ниже — реализованные пути.

| Метод | Путь | Auth | Назначение |
|---|---|---|---|
| GET | `/zones/current?lat&lng` | Bearer | TTL зоны, `isFirstEver`, waitlist-поля |
| GET | `/stings/nearest?lat&lng&limit` | Bearer | Ближайшие активные жала, `distanceM` |
| GET | `/map/overview?swLat&swLng&neLat&neLng&zoom` | Bearer | Агрегаты res 5/6, без фото |
| GET | `/campaigns/active?lat&lng` | Bearer | Активные кампании в точке |
| POST | `/invites` | Bearer | Код приглашения, квота 5 +2/принятый, потолок 25 |
| GET | `/invites/me` | Bearer | Список кодов и `usesLeft` |
| GET | `/invites/{code}` | public | `valid`, username, центр зоны |
| POST | `/waitlist` | public | Гео-вейтлист; при `WAITLIST_ENABLED=false` → 404 `FEATURE_DISABLED` |
| GET | `/share/stings/{id}` | public HTML | OG-страница (не `/api/v1`) |
| POST | `/devices` | Bearer | Expo push token, 204 |
| DELETE | `/devices/{deviceId}` | Bearer | 204 |
| GET/PATCH | `/notifications/settings` | Bearer | Тумблеры пушей |
| PATCH | `/auth/me/settings` | Bearer | `allowEcho`, `allowSharing` |
| GET | `/auth/me/awards` | Bearer | Награды пользователя |
| POST | `/analytics/events` | optional | Батч до 50 событий |
| POST | `/admin/campaigns` | admin | Создание кампании |
| POST | `/admin/users/{id}/account-type` | admin | `personal` / `partner` / `official` |
| GET | `/admin/metrics/density` | admin | viewportDensity, emptySessionRate, DAU, p |
| GET | `/admin/metrics/retention` | admin | D1/D7/D30 по зоне |
| GET | `/admin/metrics/growth` | admin | kFactor, инвайты, share |

Улей активен (`stage: hive`), когда `activationCount >= HIVE_ACTIVATION_THRESHOLD` при капе `HIVE_AUTHOR_WEIGHT_CAP` на автора. Соло-стопка — `seed`, в `hives[]` по умолчанию не попадает.

Места заведений описаны в §3.4–§3.5 и в `часть «Места заведений»` v0.5. Клиент показывает одну обложку. Проверка юрлица и approve до публикации нет.

---

# Часть 2. ТЗ на разработку frontend

# Sting App — ТЗ на разработку frontend (React Native)

Версия: 0.4
Стек backend: Node.js + Express + MongoDB + Socket.io, контракты — `openapi.yaml` / `TECH_DOCS.md`  
Backend-ТЗ по email OTP и сбросу пароля: **`BACKEND_EMAIL_AUTH_TZ.md`** (реализуется отдельно от этого документа).  
Вход через Google: контракт **`POST /auth/google`** уже есть на backend (`hive-backend-nodejs`); frontend-ТЗ — **[раздел 8](#8-вход-через-google)**.  
Механики привлечения пользователей и борьбы с пустой картой (cold start): **`часть «Привлечение пользователей»`** (клиент) и **`BACKEND_GROWTH_TZ.md`** (сервер, источник истины по контрактам).  
Правила активации улья (улей — это люди, а не кадры) и стадия кластера: **`BACKEND_GROWTH_TZ.md` §G13** (контракт) и **`часть «Привлечение пользователей»` §G13** (клиент). Этот документ описывает улей в его текущем виде и на §G13 только ссылается.  
Места заведений (кафе/бары), верификация партнёра и фото места из галереи: **`часть «Места заведений»`** (§G14, §G15). Улей по-прежнему нельзя «создать» заведению; галерея разрешена только для витрины места, не для жал на карте.  
Жалобы на пользователя, фото и подпись к фото, а также личное скрытие его контента: **[раздел 10](#10-жалобы-и-личное-скрытие)**.

---

## Содержание

1. [Технологический стек frontend](#1-технологический-стек-frontend)
2. [Структура проекта](#2-структура-проекта)
3. [Пошаговый план разработки](#3-пошаговый-план-разработки)
4. [Требования к интеграции с API](#4-требования-к-интеграции-с-api)
5. [Нефункциональные требования](#5-нефункциональные-требования)
6. [Чек-лист готовности к сборке](#6-чек-лист-готовности-к-сборке)
7. [Идентификация по email (OTP) и восстановление пароля](#7-идентификация-по-email-otp-и-восстановление-пароля)
8. [Вход через Google](#8-вход-через-google)
9. [Фильтры маркеров на карте](#9-фильтры-маркеров-на-карте)
10. [Жалобы и личное скрытие](#10-жалобы-и-личное-скрытие)

---

## 1. Технологический стек frontend

| Слой                 | Технология                             | Причина                                                                                  |
| -------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Фреймворк            | React Native + Expo (managed workflow) | Быстрый старт, не нужен нативный Xcode/Android Studio код на старте                      |
| Навигация            | Expo Router (file-based)               | Структура `app/` уже согласована — см. раздел 2                                          |
| Язык                 | TypeScript                             | Типы можно синхронизировать с backend через `openapi.yaml`                               |
| Стили                | NativeWind (Tailwind для RN)           | Быстрая стилизация без отдельных StyleSheet-файлов на каждый компонент                   |
| Серверное состояние  | React Query (`@tanstack/react-query`)  | Кэш, инвалидация, повторные запросы — не писать вручную                                  |
| Клиентское состояние | Zustand                                | Только для auth и эфемерного UI-состояния (см. `TECH_DOCS.md`, раздел 1.5)               |
| HTTP-клиент          | Axios                                  | Интерцепторы для токена и refresh-flow                                                   |
| Realtime             | `socket.io-client`                     | Backend уже на Socket.io — версии протокола должны совпадать                             |
| Камера               | `expo-camera`                          | Официальный Expo-модуль, не требует prebuild на старте                                   |
| Геолокация           | `expo-location`                        | Аналогично                                                                               |
| Хранение токенов     | `expo-secure-store`                    | `accessToken`/`refreshToken` не должны лежать в открытом AsyncStorage                    |
| Google Sign-In       | `expo-auth-session` (Google provider)  | OAuth в системном браузере; `idToken` уходит на backend. Native SDK — вне скоупа (§8.11) |
| Карта                | `expo-yandex-mapkit`                   | Yandex MapKit, flavor `lite`. Только dev build / EAS, не Expo Go                        |

---

## 2. Структура проекта

```
sting-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Карта
│   │   ├── nearby.tsx            # Лента "Рядом"
│   │   └── profile.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── verify-otp.tsx        # Ввод 6-значного кода (register / resume)
│   │   ├── forgot-password.tsx   # Запрос кода на email
│   │   └── reset-password.tsx    # Код + новый пароль
│   ├── (modals)/
│   │   ├── _layout.tsx
│   │   ├── camera.tsx
│   │   ├── preview.tsx
│   │   └── sting/[id].tsx
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── step1.tsx
│   │   ├── step2.tsx
│   │   └── step3.tsx
│   ├── _layout.tsx                # auth-guard, провайдеры
│   └── +not-found.tsx
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts               # + google, otp/verify, otp/resend, password/forgot|reset
│   │   ├── stings.ts
│   │   ├── hives.ts
│   │   └── websocket.ts
│   ├── components/
│   │   ├── auth/                 # AuthInput, OtpInput, AuthButton, …
│   │   ├── map/
│   │   ├── camera/
│   │   ├── ui/
│   │   └── feed/
│   ├── hooks/                # + useGoogleSignIn.ts
│   ├── stores/
│   ├── utils/
│   └── types/
├── assets/
├── app.json
├── eas.json
└── package.json
```

Детальное описание ответственности каждого модуля уже зафиксировано в `TECH_DOCS.md` (разделы 1.1–1.7) — этот документ на него ссылается, а не дублирует.

---

## 3. Пошаговый план разработки

### Этап 0 — Инициализация проекта и окружение

**Задачи:**

- `npx create-expo-app sting-app --template` с TypeScript-темплейтом.
- Настроить Expo Router, NativeWind, ESLint/Prettier.
- Создать `.env`/`app.config.ts` с `API_URL`, `WS_URL` (указывают на локальный backend на этапе разработки, на прод-домен — при сборке).
- Настроить `src/api/client.ts` — базовый Axios-инстанс с `baseURL` из конфига.

**Зависимости:** нет (стартовая точка).

**Definition of Done:** пустое приложение собирается и запускается в Expo Go / симуляторе, `client.ts` успешно достукивается до `GET /api/v1/auth/me` (даже с ответом 401 — важно, что запрос доходит до backend).

**Риски:** несовпадение адреса backend при тестировании на физическом устройстве (`localhost` не сработает — нужен IP машины в локальной сети или туннель типа `ngrok`).

---

### Этап 1 — Авторизация (email + OTP + восстановление пароля)

Детальное пошаговое ТЗ флоу — **[раздел 7](#7-идентификация-по-email-otp-и-восстановление-пароля)**. Контракты backend — `BACKEND_EMAIL_AUTH_TZ.md`.

**Задачи (кратко):**

- `src/stores/authStore.ts` — `user`, `accessToken`, `refreshToken`, `status`, плюс эфемерный `pendingEmail` / `otpPurpose` для экрана OTP.
- `src/api/auth.ts` — `/auth/register`, `/auth/login`, `/auth/google`, `/auth/otp/verify`, `/auth/otp/resend`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/refresh`, `/auth/logout`, `/auth/me`.
- Интерцептор в `client.ts`: `Authorization: Bearer`, 401 → `refresh` → повтор или logout.
- Экраны: `login`, `register`, `verify-otp`, `forgot-password`, `reset-password`.
- Auth-guard: в приложение только при `status === 'authenticated'` (после успешного OTP или login).
- Токены в `expo-secure-store`; восстановление сессии при старте.

**Зависимости:** Этап 0; backend-шаги B2–B3 из `BACKEND_EMAIL_AUTH_TZ.md` (или mock/staging).

**Definition of Done:**

- Регистрация → письмо с 6-значным кодом → ввод кода → пользователь авторизован.
- Login с неподтверждённым email открывает OTP (`EMAIL_NOT_VERIFIED`).
- Восстановление пароля: email → код → новый пароль → вход/сессия.
- После перезапуска сессия восстанавливается из `SecureStore`.
- Ошибки OTP/auth показываются по `error.code` (см. раздел 7.6).

**Риски:** гонка refresh при параллельных 401; зависимость от доставки почты на устройстве (нужен доступ к inbox / staging с `OTP_DEV_LOG`).

---

### Этап 1b — Вход через Google

Детальное ТЗ — **[раздел 8](#8-вход-через-google)**. Backend: `POST /auth/google` (верификация `idToken`, find-or-create пользователя, те же JWT, что у email-login).

**Задачи (кратко):**

- Google Cloud: OAuth clients (Web + iOS + Android), consent screen, Client ID в `.env` / EAS secrets.
- `useGoogleSignIn` → `authStore.loginWithGoogle({ idToken })` → `POST /auth/google` → та же сессия, что после email-login.
- Кнопка Google на `login` и `register`; Apple/Facebook остаются заглушками.
- OTP **не** показывать: Google-email считается подтверждённым на стороне Google.

**Зависимости:** Этап 1 (authStore, сессия, auth-guard); native **dev client / production** (не Expo Go — §8.4).

**Definition of Done:** новый и существующий пользователь входят через Google на реальном устройстве (dev build), попадают в `(tabs)`, после перезапуска сессия жива. Отмена диалога Google не показывает ошибку.

**Риски:** несовпадение `audience` idToken с `GOOGLE_CLIENT_IDS` на backend; SHA-1 Android (debug vs upload keystore); App Store потребует Sign in with Apple, если в релизе останется Google без Apple (§8.8).

---

### Этап 2 — Карта и геолокация (без публикации)

**Задачи:**

- `src/hooks/useLocation.ts` — запрос разрешения, текущие координаты, точность.
- `src/components/map/MapContainer.tsx` — обёртка над Yandex MapKit, центрирование на пользователе.
- `src/hooks/useStingsNearby.ts` — React Query поверх `GET /stings/nearby`, с debounce на изменение региона карты (300мс — см. `TECH_DOCS.md`).
- `src/components/map/StingMarker.tsx` — рендер одиночных точек (без визуальной логики угасания пока — просто точка).
- `src/stores/mapStore.ts` — `region`, `selectedStingId`, `selectedHiveId`.

Фильтры маркеров («Всё / Свежее / Ульи / Скоро исчезнет») в этот этап **не входят** — отдельное ТЗ в [разделе 9](#9-фильтры-маркеров-на-карте).

**Зависимости:** Этап 1 (нужен `accessToken` для запросов).

**Definition of Done:** карта открывается, запрашивает разрешение на геолокацию, центрируется на пользователе, при перемещении карты подгружает жала из `GET /stings/nearby` и отображает точками (тестово — можно вручную создать несколько `Sting` через Postman/curl на backend, чтобы было что показывать).

**Риски:** MapKit — нативный модуль. Expo Go карту не покажет, нужен dev build. Ключ `YANDEX_MAPKIT_API_KEY` зашивается плагином при prebuild, секретом EAS для облачной сборки.

---

### Этап 3 — Камера и публикация жала

**Задачи:**

- `src/hooks/useCamera.ts` — permissions, вызов `expo-camera`, запись временного файла.
- `src/components/camera/CameraView.tsx`, `CaptureButton.tsx`.
- `src/stores/cameraStore.ts` — `capturedUri`, `captureCoords`, `captureAccuracy`.
- `app/(modals)/camera.tsx` → `app/(modals)/preview.tsx` — флоу съёмки и подтверждения.
- `src/api/stings.ts` — `POST /stings` через `multipart/form-data`, с заголовком `Idempotency-Key` (генерировать `uuid` на старте флоу публикации, не на каждый retry).
- Обработка ответа `422 STING_VALIDATION_FAILED` — понятное сообщение пользователю, а не молчаливый сбой.
- Обработка `429 RATE_LIMITED`.

**Зависимости:** Этап 1 (auth), Этап 2 (нужны текущие координаты).

**Definition of Done:** реальное фото с камеры публикуется на backend, загружается в R2, новое жало появляется на карте (после инвалидации/рефетча `useStingsNearby`). Из галереи выбрать фото невозможно — это стоит проверить явно как приёмочный критерий, а не предположение.

**Риски:** размер фото с современных телефонных камер (часто 8-15MB) — стоит замерить реальное время загрузки на мобильном интернете и решить, нужен ли клиентский resize перед отправкой (backend уже генерирует thumbnail, но сам оригинал грузится как есть).

---

### Этап 4 — Улья и детальный просмотр

**Задачи:**

- `src/components/map/HiveCircle.tsx` — визуализация кластера, масштаб/пульсация от `activeStingsCount`.
- `src/components/ui/HiveBottomSheet.tsx` — список фото улья через `GET /hives/:id` или пагинированно через `GET /hives/:id/stings`.
- `app/(modals)/sting/[id].tsx` — полноэкранный просмотр одного жала (`GET /stings/:id`), таймер до истечения (`src/hooks/useCountdown.ts`), реакции (`POST /stings/:id/reactions`).
- `src/components/ui/Timer.tsx` — визуальный обратный отсчёт.

**Зависимости:** Этап 2 (карта), Этап 3 (нужны реальные жала на карте для тестирования кластеров — вручную создать 3+ жала в одной точке).

**Definition of Done:** при скоплении жал в одной точке карта показывает улей вместо отдельных маркеров; тап по улью открывает список; тап по фото — полноэкранный просмотр с корректным таймером.

**Риски:** нет прямой зависимости от frontend, но стоит заранее согласовать с backend, при каком количестве жал (`HIVE_ACTIVATION_THRESHOLD`) кластер реально формируется — иначе тестирование этого этапа будет буксовать без видимого результата.

Важно про тестовые данные: «3 жала в одной точке» от одного аккаунта дают улей только в текущей схеме, где порог считает кадры. По `BACKEND_GROWTH_TZ.md` §G13 активация переезжает на число участников (≥ 3 жала минимум от 2 авторов), поэтому проверять улей нужно с двух аккаунтов, а соло-кластер — это отдельное состояние («сота», `часть «Привлечение пользователей»` §G13), а не улей.

---

### Этап 5 — Realtime (WebSocket)

**Задачи:**

- `src/api/websocket.ts` — синглтон-менеджер, `connect()`/`disconnect()`, авто-reconnect.
- Подписка на регион карты (`subscribe:region`) при изменении `mapStore.region`, `unsubscribe:region` при уходе с экрана карты.
- Обработчики `sting:created`, `sting:expired`, `hive:updated`, `hive:dissolved`, `sting:reaction` → `queryClient.setQueryData`/`invalidateQueries` (см. `TECH_DOCS.md`, раздел 4) — не собственное состояние в компонентах.
- `ping`/`pong` каждые 25с — обычно закрывается настройками `socket.io-client`, но стоит явно проверить таймауты.

**Зависимости:** Этап 2 (нужен `mapStore.region`), Этап 4 (события про ульи).

**Definition of Done:** публикация нового жала с одного устройства появляется на карте другого устройства/симулятора без ручного обновления — в течение секунд, не по таймеру рефетча.

**Риски:** нестабильное мобильное соединение — реальная причина, по которой backend выбрал Socket.io (fallback на long-polling), стоит явно протестировать на плохом Wi-Fi/переключении сетей, не только на локалхосте.

---

### Этап 6 — Лента "Рядом" и Профиль

**Задачи:**

- `app/(tabs)/nearby.tsx` + `src/components/feed/NearbyCard.tsx` — список вместо карты, использует те же данные из `useStingsNearby`.
- `app/(tabs)/profile.tsx` — данные из `/auth/me`, кнопка выхода (`logout` + `POST /auth/logout` с текущим `refreshToken`, очистка `SecureStore`).

**Зависимости:** Этап 1, Этап 2.

**Definition of Done:** лента показывает те же жала, что карта, отсортированные по дистанции; logout реально отзывает `refreshToken` на backend (не только чистит локальный стейт).

---

### Этап 7 — Онбординг

**Задачи:**

- `app/(onboarding)/step1-3.tsx` — объяснение концепции (только камера, TTL 4 часа, ульи).
- Экран-объяснение permissions перед системным попапом (геолокация, камера).
- Флаг `hasCompletedOnboarding` в `authStore`, персистится, чтобы не показывать повторно.

**Зависимости:** независим по коду, но логически идёт перед Этапом 1 в пользовательском флоу — реализовать можно в любой момент, но подключить к навигации нужно после того, как auth-guard (Этап 1) готов.

**Definition of Done:** новый пользователь видит онбординг один раз; повторный запуск приложения сразу ведёт на карту/логин.

---

### Этап 8 — Полировка, обработка ошибок, подготовка к сборке

**Задачи:**

- Единый компонент/тост для отображения ошибок API по `error.code` из `ErrorResponse` (см. `openapi.yaml`) — не показывать пользователю сырой `message` с backend напрямую без контроля тона.
- Обработка полного отсутствия сети (не просто ошибка запроса, а `NetInfo`-проверка) — отдельный экран/баннер "нет соединения", а не пустая карта без объяснений.
- Пустое состояние карты/ленты (когда рядом никого нет).
- `eas.json` — профили сборки (`development`, `preview`, `production`).
- Иконка, splash screen, `app.json` — название, bundle identifier.
- Ручное сквозное тестирование полного флоу на реальном устройстве (не только симулятор — камера и геолокация ведут себя иначе).

**Зависимости:** все предыдущие этапы.

**Definition of Done:** приложение собирается через `eas build` без ошибок, полный пользовательский флоу (онбординг → регистрация → OTP → карта → съёмка → просмотр улья → выход; отдельно — forgot/reset пароля; отдельно — вход через Google) проходится вручную без сбоев на реальном устройстве.

---

## 4. Требования к интеграции с API

- **Базовый URL** — берётся из `app.config.ts`/env, не хардкодится в `client.ts`.
- **Формат ошибок** — все ответы 4xx/5xx приходят как `{ error: { code, message, details } }` (см. `openapi.yaml`, `ErrorResponse`). Frontend обязан читать `error.code` для логики (например, показать разные экраны для `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `OTP_EXPIRED`, `RATE_LIMITED`), а `error.message` использовать только как fallback-текст, не как основной источник UX-копирайта.
- **Auth без токена** — `register`, `login`, `google`, `otp/*`, `password/forgot`, `password/reset`, `refresh` вызываются с `skipAuthRefresh: true`.
- **Google `idToken`** — одноразовый proof для `POST /auth/google`. Не логировать, не класть в AsyncStorage/SecureStore, не передавать никуда кроме этого эндпоинта. После `setSession` клиент работает только со своими JWT.
- **Idempotency-Key** — обязателен на `POST /stings`, генерируется один раз в начале флоу публикации (при входе на `camera.tsx`), не при каждой попытке отправки — иначе теряет смысл при ретрае после обрыва связи.
- **Токены** — `accessToken` держится только в памяти (Zustand) + `SecureStore` для восстановления между запусками; `refreshToken` — только в `SecureStore`, никогда не логируется и не передаётся куда-либо кроме `POST /auth/refresh`.
- **OTP** — код никогда не логируется на клиенте; не сохраняется в AsyncStorage дольше текущего флоу (достаточно state экрана / store до verify).

---

## 5. Нефункциональные требования

- **Permissions UX** — разрешения на камеру/геолокацию запрашиваются только после экрана-объяснения (Этап 7), не сразу при первом запуске без контекста — так выше конверсия в "разрешить".
- **Обработка низкой точности GPS** — если `accuracy` хуже порога (например, >50м), предупреждать пользователя перед публикацией, а не просто отправлять как есть (соответствует `useLocation.ts` из `TECH_DOCS.md`).
- **Производительность карты** — при большом количестве маркеров в области экрана рендерить только видимые (или полагаться на кластеризацию backend, которая уже возвращает ульи вместо десятков отдельных точек — см. `TECH_DOCS.md`, раздел 3.2).
- **Тестирование** — при одном разработчике полноценные E2E-тесты (Detox и т.п.) избыточны на MVP-этапе; приоритет — ручной чек-лист сквозного флоу перед каждым релизом (шаблон см. Этап 8 и раздел 7.7).
- **Auth UX** — поле OTP должно поддерживать автоподстановку из SMS/почты где платформа даёт (`textContentType="oneTimeCode"` / `autoComplete="sms-otp"` — для email-кода по возможности `oneTimeCode`); кнопка «Отправить снова» неактивна во время cooldown.
- **Google Sign-In runtime** — целевая среда: EAS development / preview / production. Expo Go не является поддерживаемым рантаймом для этого флоу (чужой bundle id / package name, Web-client не принимает `exp://` и custom scheme как redirect URI).

---

## 6. Чек-лист готовности к сборке

- [ ] Все этапы 0–8 пройдены и вручную проверены на реальном устройстве
- [ ] Флоу раздела 7 (register OTP + forgot/reset) пройден на staging с реальной почтой
- [ ] Флоу раздела 8 (Google Sign-In) пройден на dev build / preview на iOS и Android
- [ ] Client ID Google заданы в EAS secrets / `.env`, не закоммичены; `idToken` не логируется
- [ ] `.env`/`app.config.ts` указывает на продакшен `API_URL`/`WS_URL`, не на localhost
- [ ] Токены и OTP-коды не логируются в консоль ни в одном месте кода
- [ ] Иконка и splash screen на месте, `app.json` заполнен (name, slug, bundle identifiers)
- [ ] `eas.json` содержит рабочий `production`-профиль
- [ ] Пройден полный сценарий: регистрация → OTP → съёмка → появление на карте у второго пользователя в реальном времени → истечение через реальные (или ускоренные для теста) 4 часа

---

## 7. Идентификация по email (OTP) и восстановление пароля

Пошаговое frontend-ТЗ. Backend-контракты, модель OTP, почта и rate limit — в **`BACKEND_EMAIL_AUTH_TZ.md`**. Не дублировать серверную логику в этом разделе.

### 7.1. Цель продукта

1. Пользователь регистрируется по email; приложение **не пускает в основной UI**, пока email не подтверждён **6-значным кодом** из письма. После верного кода пользователь **входит** (получает сессию).
2. Обычный вход: email + пароль (только для подтверждённых аккаунтов).
3. Если пароль забыт: запрос кода на email → ввод кода → новый пароль → вход/сессия.

### 7.2. Пользовательские сценарии

#### Сценарий A — Регистрация с подтверждением email

```
register → (backend шлёт OTP) → verify-otp → (tabs)
```

| Шаг | Экран        | Действие пользователя                            | API                                                            | Успех                                                                                                |
| --- | ------------ | ------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A1  | `register`   | username, email, password → «Зарегистрироваться» | `POST /auth/register`                                          | Сохранить `pendingEmail`, `otpPurpose=register`; **не** писать токены; `router.push` на `verify-otp` |
| A2  | `verify-otp` | Ввод 6 цифр                                      | `POST /auth/otp/verify` `{ email, code, purpose: "register" }` | Сохранить `user` + tokens → `status=authenticated` → `/(tabs)`                                       |
| A3  | `verify-otp` | «Отправить код снова» (после cooldown)           | `POST /auth/otp/resend`                                        | Сброс полей ввода, новый countdown                                                                   |

Клиентская валидация на A1: непустые поля; email-формат; password ≥ 8 символов.

#### Сценарий B — Login при ещё не подтверждённом email

```
login → 403 EMAIL_NOT_VERIFIED → verify-otp → (tabs)
```

| Шаг | Действие                              | Поведение                                                                             |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| B1  | Верные credentials, email не verified | Показать OTP; `pendingEmail` из `error.details.email`; опционально сразу `otp/resend` |
| B2  | Успешный verify                       | Как A2                                                                                |

#### Сценарий C — Обычный login

```
login → (tabs)
```

`POST /auth/login` → сессия. Ошибка `INVALID_CREDENTIALS` — сообщение на форме.

#### Сценарий D — Восстановление пароля

```
login → forgot-password → reset-password → (tabs) или login
```

| Шаг | Экран             | Действие                         | API                          | Успех                                                                                      |
| --- | ----------------- | -------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| D1  | `login`           | Тап «Забыли пароль?»             | —                            | `forgot-password`                                                                          |
| D2  | `forgot-password` | Email → «Отправить код»          | `POST /auth/password/forgot` | Всегда успех UX (anti-enumeration); → `reset-password` с email                             |
| D3  | `reset-password`  | 6 цифр + newPassword (+ confirm) | `POST /auth/password/reset`  | Если backend вернул tokens — сразу `(tabs)`; если 204 — `login` с тостом «Пароль обновлён» |
| D4  | Resend            | Как A3, `purpose=password_reset` | `POST /auth/otp/resend`      | Новый countdown                                                                            |

### 7.3. Экраны и UI-требования

| Экран             | Ключевые элементы                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `register`        | username, email, password; ссылка на login; после submit — только переход на OTP, без «тихого» входа                                  |
| `login`           | email, password; «Забыли пароль?»; ссылка на register; обработка `EMAIL_NOT_VERIFIED`                                                 |
| `verify-otp`      | маскированный email; `OtpInput` на 6 ячеек; таймер TTL (опционально); «Отправить снова» + countdown cooldown; назад на register/login |
| `forgot-password` | email; CTA отправки кода; назад на login                                                                                              |
| `reset-password`  | OtpInput; newPassword; confirmPassword; resend                                                                                        |

Общие правила UI:

- Переиспользовать `AuthScreenLayout` / `AuthFormCard` / `AuthButton` / `AuthInput`.
- Новый компонент `OtpInput`: 6 позиций, автофокус следующей, поддержка paste целиком (`123456`).
- i18n: ключи в `ru.ts` / `en.ts` для всех новых строк и `error.code` из §7.6.
- Не показывать сырой `error.message` с backend как основной копирайт.

Параметры навигации (Expo Router):

- `verify-otp?email=...&purpose=register|password_reset` (email дублировать в store на случай потери query).
- `reset-password?email=...`.

### 7.4. Состояние и API-слой

#### `authStore` (дополнения)

| Поле / action                                        | Назначение                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `pendingEmail: string \| null`                       | Email ожидающего OTP                                         |
| `otpPurpose: 'register' \| 'password_reset' \| null` | Контекст OTP-экрана                                          |
| `register()`                                         | Вызов API register → выставить pending*, **без** tokens      |
| `verifyOtp({ email, code, purpose })`                | При успехе — как текущий login (tokens + user + SecureStore) |
| `resendOtp({ email, purpose })`                      | Обёртка resend                                               |
| `forgotPassword({ email })`                          | Запрос кода сброса                                           |
| `resetPassword({ email, code, newPassword })`        | Сброс; при tokens — установить сессию                        |
| `clearPendingOtp()`                                  | Очистка pending при уходе с флоу                             |

Существующие `login` / `logout` / `hydrate` сохранить; в `login` при `EMAIL_NOT_VERIFIED` пробрасывать ошибку на UI (не глотать в store).

#### `src/api/auth.ts` (новые обёртки)

```ts
register(...)           // → { status, email, purpose, expiresInSec, resendAvailableInSec }
verifyOtp(...)          // → AuthSession
resendOtp(...)          // → { status, email, purpose, expiresInSec, resendAvailableInSec }
forgotPassword(...)     // → otp_sent payload
resetPassword(...)      // → AuthSession | void
```

Все с `skipAuthRefresh: true`.

#### Типы

Добавить в `src/types` DTO ответов OTP (`OtpChallengeResponse`, `OtpPurpose`) в соответствии с `BACKEND_EMAIL_AUTH_TZ.md` / OpenAPI.

### 7.5. Пошаговый план реализации (frontend)

| Шаг    | Задачи                                                                                                                        | DoD                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **F0** | Согласовать финальный контракт с `BACKEND_EMAIL_AUTH_TZ.md`; обновить типы                                                    | Типы компилируются; расхождений с backend-доком нет       |
| **F1** | `auth.ts`: новые методы; i18n-ключи ошибок OTP                                                                                | Вызовы работают против staging/mock                       |
| **F2** | `OtpInput` + экран `verify-otp` (UI + локальный state, без полного store)                                                     | Можно ввести/вставить 6 цифр, виден email и resend-кнопка |
| **F3** | Переключить `register`: убрать мгновенный `replace('/(tabs)')`; store `pending*`; навигация на OTP; `verifyOtp` → сессия      | Сценарий A end-to-end                                     |
| **F4** | Login: обработка `EMAIL_NOT_VERIFIED` → OTP (сценарий B)                                                                      | Неconfirmed user доходит до tabs только после кода        |
| **F5** | `forgot-password` + `reset-password` + ссылка с login (сценарий D)                                                            | Сброс пароля работает; старый пароль на login не проходит |
| **F6** | Cooldown resend (`resendAvailableInSec` / `details.retryAfterSec`); UX `OTP_EXPIRED` / `OTP_MAX_ATTEMPTS` (предложить resend) | Кнопка resend блокируется; ошибки понятны                 |
| **F7** | Ручной регресс: A–D + перезапуск приложения после verify                                                                      | Чек-лист §7.7 закрыт                                      |

### 7.6. Маппинг ошибок → UX

| `error.code`          | UX                                                  |
| --------------------- | --------------------------------------------------- |
| `VALIDATION_ERROR`    | Подсветка полей / «Проверьте данные»                |
| `USER_ALREADY_EXISTS` | На register: «Аккаунт уже есть» + ссылка на login   |
| `INVALID_CREDENTIALS` | На login: «Неверный email или пароль»               |
| `EMAIL_NOT_VERIFIED`  | Редирект/навигация на `verify-otp`                  |
| `OTP_INVALID`         | «Неверный код»                                      |
| `OTP_EXPIRED`         | «Код истёк» + акцент на resend                      |
| `OTP_MAX_ATTEMPTS`    | «Слишком много попыток» + resend нового кода        |
| `OTP_RESEND_COOLDOWN` | Заблокировать кнопку; взять `details.retryAfterSec` |
| `OTP_RATE_LIMITED`    | «Подождите и попробуйте позже»                      |
| `EMAIL_SEND_FAILED`   | «Не удалось отправить письмо, повторите»            |

### 7.7. Приёмочный чек-лист (ручной)

- [ ] Новый email: register → код на почте → верный код → попал в tabs, `/auth/me` ок
- [ ] Неверный код 1–2 раза — ошибка, аккаунт не активирован
- [ ] Просроченный / исчерпанный код — понятное сообщение, resend помогает
- [ ] Resend раньше cooldown — кнопка неактивна / ошибка с таймером
- [ ] Login до verify → OTP → вход
- [ ] Login после verify с паролем → tabs без OTP
- [ ] Forgot → код → новый пароль → вход новым паролем; старый не работает
- [ ] «Забыли пароль» для несуществующего email — тот же успех UI, без утечки
- [ ] После успешного OTP перезапуск приложения сохраняет сессию
- [ ] OTP и токены не печатаются в Metro/логах

### 7.8. Вне скоупа (frontend)

- Смена email в профиле
- Вход только по OTP без пароля (passwordless)
- Deep link из письма с кодом в query (можно добавить позже)
- Капча на клиенте (если появится — отдельная задача)
- Вход через Google — **[раздел 8](#8-вход-через-google)** (не дублировать OTP-логику)

---

## 8. Вход через Google

Пошаговое frontend-ТЗ. Верификация токена, find-or-create пользователя и выдача JWT — на backend (`POST /auth/google`). Не дублировать серверную логику в этом разделе.

**Состояние репозитория на момент ТЗ:** слой частично есть (`useGoogleSignIn`, `authApi.loginWithGoogle`, `authStore.loginWithGoogle`, i18n, env). Кнопки на `login`/`register` ещё не обязаны быть подключены. Задача этапа — довести флоу до DoD, а не писать с нуля.

### 8.1. Цель продукта

1. Пользователь на экране входа или регистрации тапает «Google» и **сразу входит** в приложение: отдельный OTP для Google-email **не нужен** (email уже подтверждён у Google).
2. Новый Google-аккаунт создаётся на backend автоматически (username из имени/email, опционально аватар из Google). Пользователь не заполняет форму регистрации.
3. Если email уже есть (регистрация по паролю) — Google **привязывается** к этому пользователю, сессия выдаётся тому же аккаунту. Двух профилей с одним email быть не должно.
4. После успеха — та же сессия Hive (`accessToken` / `refreshToken` в SecureStore), что после email-login. Auth-guard и hydrate не различают способ входа.

### 8.2. Архитектура флоу

```
[login / register]
        │ tap Google
        ▼
expo-auth-session (системный браузер / SFSafari / Chrome Custom Tabs)
        │ idToken (JWT от Google)
        ▼
POST /auth/google { idToken }     skipAuthRefresh: true
        │ backend: verifyIdToken(audience = GOOGLE_CLIENT_IDS)
        │          findOrCreate(googleId / email) → issueTokens
        ▼
{ user, tokens }  →  authStore.setSession()  →  /(tabs)
```

Клиент **не** доверяет полям Google-профиля сам: username, email, avatar выставляет backend. Клиент передаёт только `idToken`.

`audience` (`aud`) в idToken равен **тому Client ID, которым открыли OAuth** (Web / iOS / Android — разные). На backend в `GOOGLE_CLIENT_IDS` должны быть **все** Client ID приложения, иначе верификация падает с `GOOGLE_AUTH_FAILED`.

### 8.3. Пользовательские сценарии

#### Сценарий G1 — Новый пользователь

```
login|register → Google account picker → POST /auth/google → (tabs)
```

| Шаг  | Действие                                                                     | Поведение                                                               |
| ---- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| G1.1 | Тап по кнопке Google                                                         | Показать системный OAuth; кнопка в loading; email-форма не валидируется |
| G1.2 | Пользователь выбирает аккаунт и подтверждает                                 | Получить `idToken` → `loginWithGoogle`                                  |
| G1.3 | Backend создаёт user (`googleId`, `emailVerified=true`, `passwordHash=null`) | `setSession` → `router.replace('/(tabs)')`. OTP-экраны не открывать     |

Онбординг показывается по существующему флагу `hasCompletedOnboarding`, независимо от способа входа.

#### Сценарий G2 — Повторный вход тем же Google

`googleId === sub` → сессия, без создания второго пользователя.

#### Сценарий G3 — Email уже зарегистрирован паролем (linking)

Пользователь ранее прошёл §7 (email + OTP). Входит через Google с **тем же email**.

Backend привязывает `googleId`, помечает email verified, выдаёт сессию **существующего** user. На клиенте это неотличимо от G1/G2: успех → tabs.

Дальше пользователь может входить и паролем, и Google.

#### Сценарий G4 — Конфликт аккаунтов

Email уже привязан к **другому** `googleId` → `409 GOOGLE_ACCOUNT_CONFLICT`. Остаться на текущем экране, показать i18n по `error.code`. Сессию не писать.

#### Сценарий G5 — Отмена / dismiss

Пользователь закрыл sheet / браузер (`cancel` / `dismiss`). **Не** показывать ошибку, не вызывать API. Снять loading.

#### Сценарий G6 — Google-only пользователь и пароль

У такого user нет `passwordHash`. `POST /auth/login` с паролем даёт `INVALID_CREDENTIALS` (как неверный пароль — без утечки «это Google-аккаунт»).

Frontend **не** обещает отдельный экран «создайте пароль». Forgot-password для Google-only — поведение backend; клиент не делает спец-ветки, пока API не вернёт отдельный `error.code`.

#### Сценарий G7 — Не подтверждённый email у Google

`401 GOOGLE_EMAIL_NOT_VERIFIED`. Сообщение на форме, сессии нет. Не уводить на `verify-otp` Hive: это не наш OTP.

### 8.4. Конфигурация и рантайм

#### Client ID

| Переменная                             | Где                               | Зачем                                                           |
| -------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`     | `.env`, `app.config.ts` → `extra` | Обязателен. Часто `aud` idToken = Web client (`serverClientId`) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`     | то же                             | iOS OAuth client, bundle `site.hiveapp.app`                         |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | то же                             | Android OAuth client, package `site.hiveapp.app` + SHA-1            |

Проброс уже есть в `app.config.ts` / `src/config/env.ts`. Значения **не** коммитить. Для EAS — secrets / `eas.json` env, не хардкод в git.

На backend: `GOOGLE_CLIENT_IDS` (через запятую) **включает те же** Web, iOS и Android Client ID.

#### Google Cloud Console (чеклист, не код)

1. OAuth consent screen (External / Testing + test users на этапе разработки).
2. **Web application** Client ID — для мобилки Authorized redirect URIs / JS origins можно оставить пустыми: Google Web-тип **не принимает** `exp://` и `hiveapp://`.
3. **iOS** Client ID: bundle id `site.hiveapp.app`.
4. **Android** Client ID: package `site.hiveapp.app` + SHA-1 **того keystore, которым подписана установленная сборка** (debug / EAS development ≠ Play upload key).

Scheme приложения: `hiveapp` (`app.config.ts`).

#### Почему не Expo Go

| Причина                                                           | Следствие                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Bundle / package Expo Go — `host.exp.Exponent`, не `site.hiveapp.app` | iOS/Android OAuth clients Hive не совпадут                                             |
| Web client не принимает `exp://` и custom scheme                  | Нестабильный/невозможный redirect в Go                                                 |
| Целевой UX — native build                                         | Тестировать в **dev client** (`eas.json` profile `development`) или preview/production |

Если Client ID не заданы — UI-ошибка `auth.googleNotConfigured`, без вызова Google и без запроса к API.

Если OAuth-библиотека/native-конфиг требуют dev client, а пользователь в Expo Go — `auth.googleRequiresDevBuild` (не сырой exception).

### 8.5. Экраны и UI-требования

| Экран      | Требование                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `login`    | Ряд «или войти через»: **Google — рабочая кнопка**; Apple и Facebook — disabled/placeholder без `onPress` (не имитировать успех)        |
| `register` | Тот же Google-вход (тот же API find-or-create). Не заставлять заполнять username/password перед Google                                  |
| Оба        | Общий компонент кнопки (например `AuthSocialButton` / обёртка над текущим кругом 52×52), `accessibilityLabel` из `auth.loginWithGoogle` |

Правила UI:

- Переиспользовать `AuthScreenLayout` / `AuthFormCard`. Loading Google **не** блокирует всю форму как submit email, но повторный тап по Google игнорируется, пока `isPrompting` / запрос к API.
- Ошибки — через `getApiErrorMessage` / ключи `errors.*` и `auth.google*` (§8.7). Не показывать сырой `error.message` как основной копирайт.
- Успех: `router.replace('/(tabs)')`, как у email-login. `clearPendingOtp` уже внутри `setSession`.
- Пока `isReady === false` или идёт `isPrompting` — кнопка `disabled`. Нет Client ID: тап показывает `auth.googleNotConfigured`, без silent no-op и без краша.

i18n (уже заведены, не плодить дубликаты): `auth.loginWithGoogle`, `auth.googleLoginFailed`, `auth.googleNotConfigured`, `auth.googleRequiresDevBuild`, `errors.GOOGLE_*`. Добавить `errors.ACCOUNT_DISABLED`, если ещё нет.

### 8.6. Состояние и API-слой

#### `src/hooks/useGoogleSignIn.ts`

Ответственность: конфиг Client ID, `Google.useAuthRequest`, `promptAsync`, разбор `idToken` из `authentication.idToken` или `params.id_token`, игнор cancel/dismiss, защита от двойной обработки одного token.

Не вызывает API и не пишет store — только `onSuccess(idToken)` / `onError(i18nKey)`.

SDK: Expo 55, `expo-auth-session` (Google provider). Перед правками сверять [доку Expo SDK 55 AuthSession](https://docs.expo.dev/versions/v55.0.0/sdk/auth-session/). Хелперы Google в AuthSession помечены deprecated в пользу native SDK — **остаёмся на auth-session**, пока флоу стабилен на dev build; миграция — §8.11.

#### `src/api/auth.ts`

```ts
loginWithGoogle({ idToken: string }); // POST /auth/google → AuthSession
```

`skipAuthRefresh: true`. Тело строго `{ idToken }`, без email/username с клиента.

#### `authStore`

`loginWithGoogle({ idToken })`: как `login` — `clearSession` → API → `setSession`. Ошибки пробрасывать на UI, не глотать.

#### Синхронизация контракта

Добавить `POST /auth/google` в `openapi.yaml` приложения и в `TECH_DOCS.md` §3.1 (сейчас дыра относительно backend). Request/response как у `/auth/login`.

```json
// Request
{ "idToken": "eyJ..." }

// Response 200
{ "user": User, "tokens": AuthTokens }
```

### 8.7. Маппинг ошибок → UX

| Источник                            | UX                                                  |
| ----------------------------------- | --------------------------------------------------- |
| cancel / dismiss                    | Тишина, снять loading                               |
| нет Client ID                       | `auth.googleNotConfigured`                          |
| нет idToken после success           | `auth.googleLoginFailed`                            |
| Expo Go / отсутствует native-конфиг | `auth.googleRequiresDevBuild`                       |
| `VALIDATION_ERROR`                  | «Проверьте данные» / generic                        |
| `GOOGLE_AUTH_FAILED`                | «Не удалось проверить вход через Google»            |
| `GOOGLE_EMAIL_NOT_VERIFIED`         | «Email Google не подтверждён»                       |
| `GOOGLE_AUTH_NOT_CONFIGURED`        | «Google Sign-In не настроен на сервере»             |
| `GOOGLE_ACCOUNT_CONFLICT`           | «Этот email уже привязан к другому Google-аккаунту» |
| `ACCOUNT_DISABLED`                  | «Аккаунт заблокирован» (не пускать в tabs)          |
| сеть / timeout                      | существующие `errors.network` / `errors.timeout`    |

### 8.8. Пошаговый план реализации (frontend)

| Шаг    | Задачи                                                                                                                            | DoD                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **G0** | Сверить `POST /auth/google` с backend; дописать OpenAPI / `TECH_DOCS.md`; `GOOGLE_CLIENT_IDS` на staging включает Web+iOS+Android | Контракт совпадает; 503 `GOOGLE_AUTH_NOT_CONFIGURED` только если секреты реально пусты |
| **G1** | Довести `useGoogleSignIn`: cancel без ошибки, нет лога idToken, `isPrompting`, идемпотентность response                           | В симуляторе/dev client picker открывается, cancel безопасен                           |
| **G2** | Общая кнопка; подключить на `login` и `register`; loading + ошибки                                                                | Сценарии G1–G5 на обоих экранах                                                        |
| **G3** | Store/API уже есть — регресс: сессия, hydrate, logout, `/auth/me`                                                                 | После Google — тот же путь, что после пароля                                           |
| **G4** | Client ID в `.env` / EAS secrets; Android SHA-1 той сборки, что стоит на устройстве; iOS bundle                                   | G1–G3 на **физическом** iOS и Android dev/preview                                      |
| **G5** | Чек-лист §8.10                                                                                                                    | Закрыт вручную                                                                         |

### 8.9. Риски

- **Audience mismatch** — idToken выписан на iOS/Android client, а backend знает только Web (или наоборот) → `GOOGLE_AUTH_FAILED`. Лечится полным списком Client ID на сервере.
- **SHA-1** — debug keystore Mac ≠ EAS credentials ≠ Play App Signing. Для каждой подписи — свой Android OAuth client или несколько SHA-1.
- **App Store 4.8** — если в продакшен-сборке есть Google (или другой сторонний логин), Apple требует Sign in with Apple. Пока Google только в dev/preview — ок; перед сабмитом в App Store Apple — отдельная задача (§8.11).
- **Google-only без пароля** — «Забыли пароль?» не должен обещать вход, которого нет; не менять anti-enumeration forgot-флоу без backend-кода.

### 8.10. Приёмочный чек-лист (ручной)

Прогонять на **dev client или preview**, не в Expo Go.

- [ ] Новый Google-аккаунт: тап → picker → tabs; OTP не показывается; `/auth/me` ок
- [ ] Повторный вход тем же Google — тот же user id, второй аккаунт не создаётся
- [ ] Email+пароль, затем Google с тем же email — тот же user, оба способа входа работают
- [ ] Отмена picker — остаёмся на login/register, без красной ошибки
- [ ] Нет Client ID в env — понятное «не настроено», без краша
- [ ] Неверный/просроченный idToken (если воспроизвести) — `GOOGLE_AUTH_FAILED`, сессии нет
- [ ] После Google перезапуск приложения сохраняет сессию
- [ ] Logout отзывает refresh и возвращает на auth
- [ ] `idToken` и Client secret не печатаются в Metro
- [ ] Apple/Facebook по-прежнему ничего не логинят
- [ ] iOS и Android пройдены отдельно (разные Client ID / SHA-1)

### 8.11. Вне скоупа (frontend)

- Sign in with Apple / Facebook (кнопки-заглушки остаются)
- `@react-native-google-signin/google-signin` (native One Tap) — возможная замена auth-session позже
- Привязка / отвязка Google из профиля у уже залогиненного пользователя
- Смена username, выданного backend при Google-регистрации
- Passwordless / вход только OTP без пароля
- Работающий Google Sign-In внутри Expo Go
- Отдельный онбординг «добро пожаловать, Google» — используется общий онбординг приложения

---

## 9. Фильтры маркеров на карте

Источник требования — дизайн `hive-design.pen`, экран `Screen/V2-Map`: ряд чипов под статус-баром («Всё», «Свежее», «Ульи», «Скоро исчезнет»). Функциональность **post-MVP**: карта из Этапа 2 остаётся работоспособной без фильтров, поэтому раздел вынесен отдельно и не блокирует раздел 6.

Backend менять не нужно: `GET /stings/nearby` отдаёт `stings[]` и `hives[]`, и всех полей для фильтрации уже достаточно (`createdAt`, `expiresAt`, `hiveId`, `activeStingsCount`). Фильтрация целиком клиентская, поверх уже загруженного ответа — дополнительных запросов при переключении чипа быть не должно.

### 9.1. Состояния фильтра

Фильтр — единственное значение (radio, не мультивыбор). Значение по умолчанию — `all`.

| Значение   | Подпись        | Что показывает на карте                       | Источник данных                         |
| ---------- | -------------- | --------------------------------------------- | --------------------------------------- |
| `all`      | Всё            | Все жала + все активные ульи                  | ответ `/stings/nearby` без изменений    |
| `fresh`    | Свежее         | Только «молодые» жала (§9.2), ульи скрыты     | `Sting.createdAt`, `Sting.expiresAt`    |
| `hives`    | Ульи           | Только активные ульи, одиночные жала скрыты   | `hives[].stage` / `isActiveHive` (§G13) |
| `expiring` | Скоро исчезнет | Только жала на исходе TTL (§9.2), ульи скрыты | `Sting.createdAt`, `Sting.expiresAt`    |

`fresh` и `expiring` — про **отдельные жала**, поэтому ульи под ними скрываются: TTL фото внутри улья клиенту неизвестен без `GET /hives/:id`, и подмешивать улей в выборку по времени было бы ложью. Условие активности улья остаётся общим — предикат `isActiveHive` из `src/utils/hive.ts`, отдельной логики для фильтра не вводить. После §G13 предикат смотрит на стадию кластера, и соты (соло-кластеры) под фильтром «Ульи» не показываются — иначе фильтр «где сейчас люди» снова начнёт врать.

### 9.2. Пороги «свежести» и «истечения» — только относительные

Абсолютные пороги («опубликовано меньше 30 минут назад») использовать **нельзя**: по `часть «Привлечение пользователей»` §G1 сервер выдаёт TTL от 4 до 72 часов в зависимости от плотности зоны, и одно и то же «осталось 30 минут» означает разное для жала на 4 часа и на 72.

Считать долю прожитого времени:

```
life     = expiresAt - createdAt
elapsed  = now - createdAt
progress = elapsed / life        // 0 — только опубликовано, 1 — истекло
```

| Константа                     | Значение | Смысл                                 |
| ----------------------------- | -------- | ------------------------------------- |
| `STING_FRESH_PROGRESS_MAX`    | `0.15`   | `progress <= 0.15` → «Свежее»         |
| `STING_EXPIRING_PROGRESS_MIN` | `0.85`   | `progress >= 0.85` → «Скоро исчезнет» |

Константы и предикаты — в `src/utils/sting-lifetime.ts`, а не в компоненте. Если `life <= 0` или даты не парсятся, жало не считается ни свежим, ни истекающим (но под `all` показывается) — некорректные данные не должны молча выкидывать маркер со всех фильтров.

### 9.3. Файлы

| Файл                                    | Ответственность                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/sting-lifetime.ts`           | `getStingProgress`, `isFreshSting`, `isExpiringSting`, константы порогов                                                        |
| `src/stores/mapStore.ts`                | `mapFilter: MapFilter`, `setMapFilter`. Без персиста — фильтр эфемерный, при новом запуске `all`                                |
| `src/hooks/useFilteredMapMarkers.ts`    | Принимает `StingsNearbyResponse \| undefined` + фильтр, возвращает `{ stings, hives }`; тикер 60с только при `fresh`/`expiring` |
| `src/components/map/MapFilterChips.tsx` | Презентационный ряд чипов: активный/неактивный вид, `onChange`. Данные не запрашивает                                           |
| `src/components/map/MapContainer.tsx`   | Рендер чипов оверлеем, использование хука вместо `data.stings` напрямую, учёт фильтра в `isEmpty`                               |
| `src/i18n/locales/{ru,en,types}.ts`     | Ключи `map.filter.*` (см. §9.5)                                                                                                 |

Тип фильтра (`MapFilter`) объявить в `src/types/index.ts` рядом с `MapBounds`, чтобы store и хук не зависели от компонента.

### 9.4. Поведение и краевые случаи

- **Переключение чипа не создаёт запрос.** Фильтр применяется к уже полученному кэшу React Query; `queryKey` в `useStingsNearby` остаётся по `bounds` и фильтр в него **не добавлять** — иначе каждое переключение будет новым сетевым запросом.
- **Пустой результат из-за фильтра ≠ пустой район.** Текущий `isEmpty` в `MapContainer` показывает `map.emptyTitle` («рядом никого»). При активном фильтре, когда до фильтрации данные были непустыми, показывать отдельный баннер `map.filter.emptyTitle` с действием «Показать всё», сбрасывающим фильтр на `all`. Смешивать эти два состояния нельзя — это прямо противоречит правилу копирайта из `часть «Привлечение пользователей»` §G1 (пустая карта формулируется как возможность, а не как отсутствие контента).
- **Течение времени.** Под `fresh`/`expiring` состав выборки меняется сам по себе, без новых данных. Хук держит тикер раз в 60 секунд и только для этих двух значений; под `all`/`hives` таймеров быть не должно.
- **WebSocket.** Новые жала попадают в кэш через `src/utils/stings-query-cache.ts` как обычно. Фильтр применяется на рендере, поэтому свежеопубликованное жало под фильтром «Скоро исчезнет» не появится — это корректное поведение, отдельной обработки не требует.
- **Жесты карты.** Ряд чипов лежит оверлеем над `MapView`. Контейнер оверлея — `pointerEvents="box-none"`, сам скролл чипов не должен перехватывать панорамирование карты за пределами своей высоты.
- **Позиционирование.** Чипы — ниже `insets.top`, выше баннера пустого состояния. `MapBookmarkButton` и индикатор `isFetching` сейчас позиционируются от `emptyBannerTop`; при добавлении чипов пересчитать отступы, чтобы ничего не перекрылось.
- **Доступность.** Активный чип помечается `accessibilityState={{ selected: true }}`, у ряда — `accessibilityRole="tablist"`-семантика через отдельные кнопки.

### 9.5. i18n

| Ключ                      | Назначение                                               |
| ------------------------- | -------------------------------------------------------- |
| `map.filter.all`          | «Всё»                                                    |
| `map.filter.fresh`        | «Свежее»                                                 |
| `map.filter.hives`        | «Ульи»                                                   |
| `map.filter.expiring`     | «Скоро исчезнет»                                         |
| `map.filter.emptyTitle`   | Заголовок «под этим фильтром ничего нет»                 |
| `map.filter.emptyMessage` | Пояснение без числа TTL (см. §G1 — «4 часа» не зашивать) |
| `map.filter.reset`        | Подпись действия сброса на «Всё»                         |

Ключи добавить во все три файла (`ru.ts`, `en.ts`, `types.ts`) одним изменением, иначе типизация локалей развалится.

### 9.6. План реализации

| Шаг    | Задачи                                                                                | Зависимости | DoD                                                                              |
| ------ | ------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| **M1** | `src/utils/sting-lifetime.ts` — прогресс и предикаты с относительными порогами        | Этап 2      | Предикаты корректны для TTL 4 ч и 72 ч; битые даты не падают                     |
| **M2** | `MapFilter` в типах, `mapFilter`/`setMapFilter` в `mapStore`, `useFilteredMapMarkers` | M1          | Переключение значения меняет выборку без сетевых запросов                        |
| **M3** | `MapFilterChips` + подключение в `MapContainer`, отступы оверлеев, i18n               | M2          | Все четыре чипа переключаются, карта остаётся панорамируемой                     |
| **M4** | Пустое состояние по фильтру + действие сброса                                         | M3          | «Пусто из-за фильтра» и «рядом никого» — разные тексты, сброс возвращает маркеры |

**Definition of Done раздела:** на карте с реальными данными каждый из четырёх чипов даёт ожидаемую выборку; переключение не вызывает запросов к `/stings/nearby`; под фильтром без результатов пользователь видит причину и кнопку сброса, а не «рядом никого».

### 9.7. Риски

- **Хардкод абсолютных порогов.** Самая вероятная ошибка реализации — «свежее = меньше 30 минут». С TTL до 72 часов (§G1) фильтр начнёт врать. Пороги держать относительными и в одном месте.
- **Фильтр в `queryKey`.** Если добавить фильтр в ключ запроса, каждое переключение чипа станет сетевым запросом и сбросом кэша — потеря `keepPreviousData` и мигание маркеров.
- **Ложная «пустая карта».** Пользователь с активным «Ульи» решит, что фото рядом исчезли. Лечится только отдельным текстом и явным сбросом (M4).
- **Перехват жестов.** Оверлей с чипами поверх `MapView` легко ломает панорамирование на Android — проверять на физическом устройстве, не только в симуляторе.

### 9.8. Приёмочный чек-лист (ручной)

- [ ] `Всё` — на карте те же маркеры, что и до появления фильтров (регресс Этапа 2)
- [ ] `Свежее` — только недавно опубликованные жала, ульи скрыты
- [ ] `Ульи` — только активные ульи по `isActiveHive`, одиночных пинов и сот (§G13) нет
- [ ] `Скоро исчезнет` — только жала на исходе TTL; проверено на жале с TTL 4 ч и на жале с TTL > 24 ч
- [ ] Переключение чипов не создаёт запросов к `/stings/nearby` (видно в логах Metro / network)
- [ ] Под фильтром без результатов показан текст фильтра, а не «рядом никого»; сброс возвращает маркеры
- [ ] Карта панорамируется и зумится под рядом чипов на физическом Android
- [ ] Перезапуск приложения открывает карту с `Всё`
- [ ] Новое жало из WebSocket появляется под `Всё` без ручного обновления

### 9.9. Вне скоупа

- Серверная фильтрация (параметр `filter` у `GET /stings/nearby`) — при росте плотности вынести отдельной задачей вместе с backend
- Мультивыбор фильтров и их комбинации
- Фильтры по автору, подпискам, реакциям
- Сохранение выбранного фильтра между сессиями
- Те же чипы на вкладке «Рядом» (`app/(tabs)/nearby.tsx`)

---

## 10. Жалобы и личное скрытие

Функциональность **post-MVP**: карта, лента и профиль из этапов 2–6 работают без этого раздела. Раздел не блокирует чек-лист раздела 6.

Жалоба и скрытие — разные действия. Жалоба пишет запись `pending` и сразу шлёт письмо на `privacy@hive.app`. Это тот же адрес, что `PRIVACY_CONTACT_EMAIL` в правилах сообщества: его читает тот, кто разбирает обращения. Отдельной роли модератора и экрана очереди в продукте нет. Пока письмо не ушло, клиент не показывает успех. Контент у остальных жалоба не снимает. Скрытие — личный фильтр в одну сторону: скрывший не видит чужие жала, подпись и профиль; скрытый по-прежнему видит скрывшего и не получает сигнала, что его скрыли. Клиент не банит и не удаляет чужой аккаунт. Решение снять контент или выставить `User.status = disabled` человек принимает по этому письму, вне приложения.

Слово «заблокировать» в `legal/community-guidelines.ts` уже значит санкцию платформы. На кнопках клиента действие называется **«Скрыть»**. В API ресурс называется `block`, но это не `User.status`. Платформенный запрет входа уже есть: `status: disabled` и `403 ACCOUNT_DISABLED` в `requireAuth` и при логине. Скрытие не меняет `status` и не вызывает этот код.

«Комментарий» в текущем продукте — поле `Sting.comment` (в модели жала максимум 280 символов), подпись к фото. Отдельной ленты комментариев нет, и этот раздел её не заводит. Третья точка входа — жалоба на подпись, если она непустая. Текст самой жалобы — отдельное поле, как у `PlaceReport`: до 500 символов.

Жалоб на пользователя и личного скрытия в `hive-backend-nodejs` ещё нет. Есть образец: `POST /places/:id/reports` и `POST /places/:id/media/:mediaId/reports` (`place-reports.service.ts`, ответ `201 { id }`). Клиент вызывает §10.5 только после того, как те же правила появятся в `openapi.yaml` бэкенда. До этого экраны не подключать к заглушкам.

### 10.1. Два действия

| Действие | Кто решает | Эффект сразу | Кого видит другой человек |
| -------- | ---------- | ------------ | -------------------------- |
| Жалоба | Человек, который читает `privacy@hive.app` | Запись в базе и письмо. Контент на карте остаётся | Ничего: ни пуша, ни метки в профиле |
| Скрыть | Сам пользователь, сразу | Его жала, подпись и профиль пропадают у скрывшего | Скрытый по-прежнему видит скрывшего |

Скрыть можно без жалобы. Жалобу можно отправить без скрытия. В форме жалобы есть отдельный чекбокс «Также скрыть у меня»; по умолчанию он выключен.

Скрытие партнёра не снимает его место с карты. Жалоба на место остаётся в `часть «Места заведений»` §10 и этим разделом не заменяется.

### 10.2. Точки входа

Одна форма, три входа. Своего пользователя и своё жало не жаловать и не скрывать: пунктов меню нет, если `authorId` или `user.id` совпадает с текущим пользователем.

| Вход | Экран | Что уходит в форму |
| ---- | ----- | ------------------ |
| Профиль | `app/(modals)/user/[id].tsx`, низ экрана | `target: user`, id профиля |
| Фото | `app/(modals)/sting/[id].tsx`, чужое жало | `target: sting`, id жала; скрытие, если отмечено, применяется к `authorId` |
| Подпись | тот же экран жала, только если `sting.comment` непустой | `target: caption`, тот же id жала; скрытие снова по `authorId` |

На карте, в ленте «Рядом» и в улье отдельной кнопки нет: оттуда открываются жало или профиль, и жалоба уходит уже оттуда. Иначе жест по пину слишком легко превращается в жалобу.

На профиле два текстовых действия в том же тоне, что `place.report` на карточке места: «Пожаловаться» и «Скрыть». На жале — «Пожаловаться на фото» и, при непустой подписи, «Пожаловаться на подпись».

### 10.3. Форма жалобы

Общий лист `SafetyReportSheet`. Лист жалобы на место (`ReportReasonSheet` в `app/(modals)/place/[id].tsx`) не переиспользовать: у места другой набор причин. Общую оболочку листа можно вынести, причины места не трогать.

Причины — один список на все три входа. Они покрывают запреты из правил сообщества (18+, экстремизм и терроризм, травля, спам, выдача себя за другого, чужие персональные данные) без того, чтобы пользователь выносил юридическую квалификацию.

| `reason` | Подпись | Комментарий |
| -------- | ------- | ----------- |
| `harassment` | Травля или угрозы | необязателен |
| `sexual_content` | Контент 18+ | необязателен |
| `illegal` | Экстремизм, терроризм или другой запрещённый контент | необязателен |
| `spam` | Спам | необязателен |
| `impersonation` | Выдаёт себя за другого | необязателен |
| `privacy` | Чужие персональные данные | необязателен |
| `stolen_photo` | Чужое фото | необязателен |
| `other` | Другое | обязателен |

Поле комментария — до 500 символов после `trim`, как `comment` у `PlaceReport`. Пустую строку не отправлять: сервер и так сохранит её как `null`. Кнопка «Отправить» неактивна, пока не выбрана причина, а для `other` — пока комментарий пуст. Это правило клиента. Валидатор мест (`comment` optional, без привязки к `other`) пустое «Другое» пропустит, поэтому клиент не должен на это полагаться.

Текст на листе, до отправки: жалоба уйдёт письмом тому, кто разбирает обращения; публикация останется на карте, пока её не снимут. Чекбокс: «Также скрыть у меня». Не обещать удаление аккаунта, бан и то, что контент исчезнет у всех.

Успех — `201` и тело `{ id }` — значит, запись сохранена и почтовый провайдер принял письмо. Тост `safety.reportSent` («Жалоба отправлена»). Повтор в этой сессии не предлагается: пункт гаснет локально, как `reported` на карточке места. У `PlaceReport` нет уникального индекса, второй `POST` создаёт ещё одну жалобу со `status: pending`. Отдельного `REPORT_ALREADY_EXISTS` нет. После перезапуска приложения сервер примет ещё одну жалобу, пока не сработает суточный лимит.

Если письмо не ушло, сервер отвечает `503 EMAIL_SEND_FAILED`, запись при этом остаётся с `emailSentAt: null`. Тост успеха не показывать, чекбокс скрытия не выполнять, форму не закрывать. Текст — `safety.reportMailFailed`. Повтор — новый `POST`: может появиться вторая запись и, если почта уже ожила, второе письмо. Это укладывается в лимит 5 в сутки.

Если чекбокс включён, после успешной жалобы клиент вызывает скрытие (§10.4). Жалоба при этом уже принята. Если скрытие падает, тост `safety.reportSentHideFailed`: жалобу повторно не слать, скрытие можно повторить с профиля.

### 10.4. Личное скрытие

Подтверждение перед скрытием с профиля (не из чекбокса жалобы — там подтверждением служит сама отправка): «Вы перестанете видеть фото и профиль {username}. Он об этом не узнает. Для остальных ничего не изменится.» Кнопки: «Скрыть» и «Отмена».

После успеха:

- тост `safety.hidden`;
- id попадает в кэш `['users', 'blocks']` из `GET /auth/me/blocks`;
- инвалидируются запросы карты, ленты, улья и этого публичного профиля;
- в `src/api/websocket.ts` отбрасываются `sting:created`, если `sting.authorId` в этом множестве, и из `hive:updated` перед записью в кэш убираются те же id из `topContributors`.

`GET /stings/nearby`, `GET /hives/:id`, `GET /hives/:id/stings` и `topContributors` в этих ответах приходят уже без скрытых авторов: сокет этого сделать не может. `emitStingCreated` / `emitHiveUpdated` в `src/sockets/realtime.ts` шлют один конверт всем сокетам, чей bbox накрывает точку. Клиентский фильтр обязателен для сокета, не вместо серверного фильтра на GET. Локальный список без сервера недостаточен: после переустановки скрытие должно сохраниться.

**Как открыть скрытого снова.** Сейчас `GET /users/:id` не получает id зрителя (`users.controller.getById` вызывает `getPublicUserProfile(id)` без `req.user`) и всегда отдаёт `PublicUserProfile`: `user` (`id`, `username`, `avatarUrl`, `bio`, `socialLinks`, `createdAt`), `stats`, `recentPhotos`. Клиент `PublicUserProfile` это и ждёт. При скрытии ответ остаётся тем же конвертом, чтобы старый экран не упал на отсутствующих `stats`:

```
{
  "user": { "id", "username", "avatarUrl", "bio": null, "socialLinks": { ...пустые }, "createdAt" },
  "stats": { "photos": 0, "hives": 0, "likes": 0, "awards": 0 },
  "recentPhotos": [],
  "blockedByViewer": true
}
```

`bio` и фото в этом ответе пустые, не настоящие. Нет флага или `false` — обычный профиль, как сейчас. Экран при `blockedByViewer: true` — заглушка: аватар, имя, «Вы скрыли этого пользователя», «Показать снова» и «Пожаловаться». Это не `404 USER_NOT_FOUND` и не экран `userProfile.notFound`.

Список всех скрытых — `GET /auth/me/blocks`, экран `app/settings/blocked-users.tsx`, пункт в `app/settings/index.tsx`. В строке — аватар, имя, «Показать снова». Пустой список — отдельный текст, не ошибка загрузки. Снятие скрытия инвалидирует те же запросы, чтобы ещё не истёкшие жала вернулись на карту.

### 10.5. Контракт, от которого зависит клиент

Пути — относительно `baseURL` клиента (префикс `/api/v1` уже в нём). Имена и коды повторяют то, что бэкенд уже делает для мест, пользователей и устройств. Новых кодов ошибок не вводить.

`GET /users/me/blocks` регистрировать нельзя: в `users.routes.ts` единственный маршрут — `GET /:id`, и `me` станет id. Списки текущего пользователя уже живут под `/auth/me` (`/stings`, `/hives`, `/liked-stings`). Скрытие — туда же.

```
POST /users/:id/reports
{ "reason": SafetyReportReason, "comment"?: string }
→ 201 { "id": string }

POST /stings/:id/reports
{ "reason": SafetyReportReason, "comment"?: string, "target": "sting" | "caption" }
→ 201 { "id": string }

POST   /users/:id/block
→ 201 { "id": string }

DELETE /users/:id/block
→ 204 пустое тело, как DELETE /devices/:deviceId

GET /auth/me/blocks
→ { "users": [{ "id", "username", "avatarUrl", "blockedAt" }] }
```

`:id` — Mongo ObjectId (`param('id').isMongoId()`), как у мест и жал. Кривой id — `422 VALIDATION_ERROR`, `details.fields` из `handleValidation`.

Жалоба повторяет `reportPlace` в записи: `requireAuth`, причина из списка, `comment` optional, max 500, trim в `null`, статус `pending`. Своё место сейчас отклоняется `422 VALIDATION_ERROR` («Нельзя пожаловаться на своё место»), без отдельного кода. Свой профиль и своё жало — тем же кодом. Дневной лимит — отдельный `userDailyLimit(5, ...)`, как `placeReportRateLimit`: 5 запросов на пользователя в 24 часа, не общий счётчик с жалобами на места.

Дальше места и пользователь расходятся. Жалоба на место остаётся только документом: письма нет, списка очереди нет, разобрать её можно лишь зная `id` через `POST /admin/place-reports/:id/resolve`. Этот раздел места не меняет. Жалоба на пользователя, фото или подпись после вставки документа шлёт одно письмо тем же транспортом, что OTP: Resend, если задан ключ, иначе SMTP, поле `from` — `smtpFrom` (`email.service.ts`). Получатель один: `privacy@hive.app`. Клиент письмо не отправляет.

`201` — только после того, как провайдер принял письмо. В документ пишется `emailSentAt`. Если отправка бросила ошибку, документ не удалять (`emailSentAt` остаётся `null`) и отвечать `503 EMAIL_SEND_FAILED`. Иначе при сбое почты жалоба снова окажется записью, которую никто не видит.

В письме достаточно, чтобы разобрать случай без админки: `id` жалобы, `target`, `reason`, текст комментария, имя и id того, на кого жалуются, id жала и `imageUrl`, если цель — фото или подпись, имя и id автора жалобы, `createdAt`. Адреса email пользователей в письмо не класть. Ссылки на несуществующую панель модерации не придумывать. Вложение файла не слать: у жала есть URL, пока оно не истекло.

Скрытие не взаимное. Тот, кого скрыли, получает обычные `nearby`, улей и профиль и не видит флага. Повторный `POST /users/:id/block` при уникальном индексе `(blockerId, blockedUserId)` попадает в общий обработчик дубля Mongo и отвечает `409 CONFLICT` (это не `USER_ALREADY_EXISTS`: тот только для `email` и `username`). Клиент считает `409` успехом. `DELETE` идемпотентен: уже снятое скрытие тоже `204`, как `deleteDevice`.

Сервер на чтении, в разрезе зрителя:

- `GET /stings/nearby` и `GET /hives/:id/stings` не отдают жала скрытых авторов;
- `topContributors` этих ответов их не содержит;
- маркер улья или соты не отдаётся, если после фильтра жал не осталось;
- `GET /users/:id` — конверт из §10.4, зритель из `req.user.id`;
- `GET /stings/:id` по скрытому автору — уже существующий `404 STING_NOT_FOUND`, не новый `403`. `403 FORBIDDEN` у жала занят: «нельзя удалить чужое».

Сокет по-прежнему общий на bbox. Пер-зрительский фильтр там не обещать.

| Ответ | Когда | UX |
| ----- | ----- | -- |
| `201 { id }` | Жалоба: запись и принятое письмо. Либо первое скрытие | Тост успеха. Если у жалобы был чекбокс — следом `POST .../block` |
| `204` | Снятие скрытия | Тост `safety.unhidden`, инвалидация карты |
| `409 CONFLICT` | Повторное скрытие | Тот же успех, что у `201`, без второго подтверждения |
| `422 VALIDATION_ERROR` | Своя цель, чужая причина, comment длиннее 500, битый id | Пункт на свою цель не показывается. Если код всё же пришёл — `safety.failed`, форму не закрывать |
| `404 USER_NOT_FOUND` | Нет пользователя | Уже существующий ключ `errors.USER_NOT_FOUND` |
| `404 STING_NOT_FOUND` | Жало истекло или скрыто от этого зрителя | Уже существующий ключ `errors.STING_NOT_FOUND`. Не объяснять, что автор скрыт |
| `429 RATE_LIMITED` | Больше 5 жалоб этого лимитера за сутки | `safety.rateLimited`. `details.retryAfterSec` у общего `tooManyRequestsHandler` всегда `60`, даже когда окно — 24 часа. Секунды из `details` для обратного отсчёта не использовать. Ключ `errors.RATE_LIMITED` не брать: там текст про публикации |
| `503 EMAIL_SEND_FAILED` | Запись есть, письмо на `privacy@hive.app` не принято провайдером | `safety.reportMailFailed`. Успех не показывать, скрытие из чекбокса не вызывать, форму оставить |
| `403 ACCOUNT_DISABLED` | Платформа отключила аккаунт того, кто делает запрос | Уже существующий выход из сессии. Это не ответ на скрытие |
| сеть / `500 INTERNAL_ERROR` | Сбой | `safety.failed`. Форма остаётся открытой, ввод не стирать |

Сырой `message` не показывать — то же правило, что в этапе 8. Тело ошибки всегда `{ error: { code, message, details } }`.

### 10.6. Файлы

| Файл | Ответственность |
| ---- | --------------- |
| `src/api/safety.ts` | `reportUser` → `POST /users/:id/reports`, `reportSting` → `POST /stings/:id/reports`, `blockUser` → `POST /users/:id/block`, `unblockUser` → `DELETE /users/:id/block`, `listBlockedUsers` → `GET /auth/me/blocks` |
| `src/components/safety/SafetyReportSheet.tsx` | Лист причин, комментарий, чекбокс скрытия. Данные сам не запрашивает |
| `src/hooks/useBlockedUserIds.ts` | Множество id из `['users', 'blocks']` для фильтра WebSocket |
| `src/api/websocket.ts` | Не писать в кэш `sting:created` скрытого автора и вычищать его из `topContributors` у `hive:updated` |
| `app/(modals)/user/[id].tsx` | Пункты жалобы и скрытия; заглушка при `blockedByViewer` |
| `app/(modals)/sting/[id].tsx` | Жалоба на фото и, при непустой подписи, на подпись |
| `app/settings/blocked-users.tsx` | Список и «Показать снова» |
| `app/settings/index.tsx` | Пункт «Скрытые пользователи» |
| `src/i18n/locales/{ru,en,types}.ts` | Ключи `safety.*` |
| `src/types/index.ts` | `SafetyReportReason`, `SafetyReportTarget`, событие аналитики |

События `safety_report_submitted` (`props.target`: `user` \| `sting` \| `caption`, `props.reason`, `props.alsoBlock`), `user_blocked`, `user_unblocked`. Id пользователя в `props` не писать. `ingestEvents` молча выбрасывает имя, которого нет в `KNOWN_EVENTS` (`analytics.service.ts`). Пока трёх имён нет рядом с `place_report_submitted`, клиент их шлёт впустую. Добавление в этот набор — часть S0, не отдельная выдумка клиента.

### 10.7. Поведение и краевые случаи

- **Свой контент.** На своём жале остаются удаление и шаринг, пунктов жалобы и скрытия нет. На своём профиле (`(tabs)/profile`) этих пунктов тоже нет.
- **Пустая подпись.** Пункта «Пожаловаться на подпись» нет. Жалоба на фото при этом доступна.
- **Улей.** Пин улья остаётся, если на сервере после фильтра ещё есть жала других людей. Фото скрытого автора внутри улья не показывать. Если сервер корректно убрал пустой кластер, клиент не рисует «пустой улей» и не пишет, что район пуст.
- **Место партнёра.** Карточка места и её пин не зависят от скрытия владельца. Гость по-прежнему жалуется на место отдельной формой.
- **Deep link на скрытый профиль.** Заглушка из §10.4, не полноценный профиль и не `userProfile.notFound`.
- **Deep link на скрытое жало.** `GET /stings/:id` отвечает `404 STING_NOT_FOUND` — тем же кодом, что истёкшее жало. Экран показывает уже существующее «не найдено» и не пишет, что автор скрыт.
- **Снятие скрытия.** Следующий `GET /stings/nearby` возвращает его актуальные жала. Истёкшие за время скрытия не воскрешать — это обычный TTL, отдельной логики нет.
- **Повторное скрытие.** `409 CONFLICT` на `POST /users/:id/block` — успех, без второго подтверждения и без текста про конфликт.
- **Доступность.** У пунктов и причин `accessibilityRole="button"`. Чекбокс скрытия сообщает состояние `checked`.

### 10.8. i18n

| Ключ | Назначение |
| ---- | ---------- |
| `safety.reportUser` | «Пожаловаться» на профиле |
| `safety.reportSting` | «Пожаловаться на фото» |
| `safety.reportCaption` | «Пожаловаться на подпись» |
| `safety.reportTitle` | Заголовок листа |
| `safety.reportHint` | Письмо уйдёт тому, кто разбирает обращения; у остальных контент остаётся |
| `safety.reportSent` | Тост успеха, когда письмо принято |
| `safety.reportMailFailed` | Запись есть, письмо не ушло. Попросите повторить |
| `safety.reportSentHideFailed` | Жалоба ушла, скрыть не удалось |
| `safety.alsoHide` | Чекбокс |
| `safety.hide` | «Скрыть» |
| `safety.hideTitle` | Заголовок подтверждения |
| `safety.hideBody` | Текст с `{username}`: он не узнает, для остальных ничего не меняется |
| `safety.hideCancel` | «Отмена» |
| `safety.hidden` | Тост «Пользователь скрыт» |
| `safety.hiddenStub` | Текст заглушки профиля |
| `safety.unhide` | «Показать снова» |
| `safety.unhidden` | Тост после снятия |
| `safety.blockedListTitle` | Заголовок экрана в настройках |
| `safety.blockedListEmpty` | Пустой список |
| `safety.reasons.*` | Подписи восьми причин |
| `safety.commentPlaceholder` | Поле комментария |
| `safety.rateLimited` | «Слишком много жалоб, попробуйте завтра» — окно `userDailyLimit` 24 часа |
| `safety.failed` | Общий сбой отправки |

Ключи добавить в `ru.ts`, `en.ts` и `types.ts` одним изменением.

### 10.9. План реализации

| Шаг | Задачи | Зависимости | DoD |
| --- | ------ | ----------- | --- |
| **S0** | В бэкенде: маршруты §10.5, письмо на `privacy@hive.app` через `email.service.ts`, `blockedByViewer` в `getPublicUserProfile(id, viewerId)`, фильтр nearby и улья, имена событий в `KNOWN_EVENTS`, запись в `openapi.yaml` | — | `201` только вместе с принятым письмом; без почты — `503` и запись с `emailSentAt: null`. Скрытый автор не приходит в nearby |
| **S1** | `src/api/safety.ts`, типы, `useBlockedUserIds`, фильтр `sting:created` и `topContributors` в `hive:updated` | S0 | Скрытие убирает пин без ожидания ручного рефетча; после перезапуска список на месте |
| **S2** | `SafetyReportSheet` + три входа на профиле и жале | S1 | Жалоба без чекбокса не скрывает; с чекбоксом скрывает автора; своё жало без пунктов |
| **S3** | Заглушка профиля, экран настроек, снятие скрытия | S1 | Deep link на скрытого показывает заглушку; «Показать снова» возвращает его жала |
| **S4** | i18n, тосты, коды ошибок, аналитика | S2, S3 | Сырой `message` не виден; `safety_report_submitted` уходит с `target` и `reason` |
| **S5** | Правило сообщества, раздел «Жалобы» | S2 | Текст говорит, что на пользователя и фото можно пожаловаться из приложения, не только письмом и не только с карточки места |

**Definition of Done раздела:** с двух аккаунтов жалобы на профиль, фото и подпись пишутся в базу и приходят письмом на `privacy@hive.app`, при этом контент у третьего аккаунта остаётся; сбой почты не показывает успех; скрытие убирает жала и профиль только у скрывшего, в том числе новое жало из WebSocket; скрытый пользователь по-прежнему видит карту скрывшего; снятие скрытия возвращает ещё живые жала; место партнёра при скрытии владельца остаётся на карте.

### 10.10. Риски

- **Кнопка «Заблокировать».** Пользователь решит, что забанил человека для всей карты. Лечится копирайтом «Скрыть» и явным «для остальных ничего не изменится».
- **Только клиентский фильтр.** После перезапуска или со второго устройства пины вернутся. Список block хранить на сервере, nearby фильтровать там же.
- **Жалоба как бан.** Если по чекбоксу или по одной жалобе прятать автора у всех, раздел ломает договорённость: снятие контента решает человек по письму. Чекбокс по умолчанию выключен, эффект только у отправителя.
- **Письмо не ушло, а тост успеха есть.** Тогда жалоба снова лежит в Mongo без читателя, как сегодняшние жалобы на места. `201` нельзя отдавать до принятия письма.
- **Пустой улей.** Скрытие единственного видимого автора не должно оставлять пин без фото и не должно подменять пустую карту growth-копирайтом «рядом никого». Пустой после фильтра кластер убирает сервер.
- **Подпись vs лента комментариев.** Отдельной сущности comment нет. Жалоба на подпись — это `target: caption` у того же `stingId`. Не заводить новый ресурс. Длина подписи на жале — 280, длина текста жалобы — 500.
- **Новые коды ошибок.** `REPORT_ALREADY_EXISTS` и `CANNOT_REPORT_SELF` некуда положить: дубль Mongo уже `409 CONFLICT`, своя цель и кривое тело уже `422 VALIDATION_ERROR`. Клиент, который ждёт новых кодов, на текущем `error.middleware` их не увидит.
- **`GET /users/me/blocks`.** Маршрут `GET /users/:id` заберёт `me` как id и ответит `404 USER_NOT_FOUND`. Список только `GET /auth/me/blocks`.
- **`details.retryAfterSec: 60`.** Для суточного лимитера это не остаток суток. Обратный отсчёт по этому полю откроет кнопку слишком рано.

### 10.11. Приёмочный чек-лист (ручной)

- [ ] Чужой профиль: «Пожаловаться» и «Скрыть»; свой профиль и своё жало — без этих пунктов
- [ ] Жалоба на фото без чекбокса: тост успеха только если письмо дошло на `privacy@hive.app`; пин остаётся у отправителя и у второго аккаунта
- [ ] Сбой почты: нет тоста успеха, форма открыта, скрытие из чекбокса не сработало, в базе запись с пустым `emailSentAt`
- [ ] Жалоба с чекбоксом: у отправителя пины автора пропадают, у второго аккаунта остаются
- [ ] Подпись пустая — пункта жалобы на подпись нет; подпись есть — уходит `target: caption`
- [ ] Причина «Другое» не отправляется с пустым комментарием
- [ ] Повтор в той же сессии не шлёт второй `POST` (кнопка погашена). После перезапуска сервер может принять ещё одну жалобу `201`, пока не вышел лимит 5 в сутки
- [ ] Шестая жалоба за сутки — `429 RATE_LIMITED` и текст «попробуйте завтра», без отсчёта 60 секунд и без текста про публикации
- [ ] Повторное скрытие (`409 CONFLICT`) показывает тот же успех, что первое (`201`)
- [ ] Скрытый не получает пуш и не видит изменений у себя в карте
- [ ] Новое жало скрытого автора по WebSocket не появляется у скрывшего
- [ ] Перезапуск приложения сохраняет скрытие
- [ ] Deep link на скрытый профиль — заглушка с именем и «Показать снова», без фото и био
- [ ] Настройки → список скрытых → «Показать снова» возвращает ещё не истёкшие жала
- [ ] Скрытие партнёра не убирает пин его места; жалоба на место по-прежнему со своей формой
- [ ] Сеть и `500` показывают `safety.failed`, не сырой `message`

### 10.12. Вне скоупа

- Удаление своего аккаунта — уже `DELETE /auth/me` и пункт в настройках; этот раздел его не описывает
- Платформенное отключение аккаунта (`User.status = disabled`, `403 ACCOUNT_DISABLED`) и админские маршруты (`/admin/users/:id/account-type`, разбор `PlaceReport`) — UI вне клиента. Скрытие не ставит `disabled`
- Экран очереди и `POST /admin/.../resolve` для жалоб на пользователя. Пока очередь — это ящик `privacy@hive.app`, а `id` в письме нужен, чтобы найти документ в базе
- Порог автосанкций по таким жалобам. У мест он уже есть (`placeReportPauseThreshold`, 30 дней) и срабатывает только после ручного accept
- Письмо по жалобе на место. Этот раздел его не добавляет
- Взаимное скрытие и экран «вас скрыли»
- Жалоба с пина на карте и с карточки ленты «Рядом», минуя экран жала
- Лента комментариев к фото как отдельная сущность
- Перенос формы жалобы на место на `SafetyReportSheet`
- Скрытие места, улья целиком или реакций отдельно от автора

---

# Часть 3. Привлечение пользователей (клиент)

# Hive — ТЗ на привлечение пользователей (frontend, React Native)

Версия: 0.1
Стек: Expo SDK 55 (см. [docs.expo.dev/versions/v55.0.0](https://docs.expo.dev/versions/v55.0.0/)), Expo Router, React Query, Zustand, NativeWind
Контракты и серверные правила: **`BACKEND_GROWTH_TZ.md`** — источник истины, здесь не дублируются
Базовое ТЗ приложения: `часть «ТЗ frontend»`; архитектура модулей: `TECH_DOCS.md`

Коды механик (`G1`…`G13`) совпадают с `BACKEND_GROWTH_TZ.md` — на них ссылаются оба документа.

---

## Содержание

1. [Что фронтенд обязан обеспечить](#1-что-фронтенд-обязан-обеспечить)
2. [Состояние репозитория на момент ТЗ](#2-состояние-репозитория-на-момент-тз)
3. [G1 — Фактический TTL вместо хардкода «4 часа»](#g1--фактический-ttl-вместо-хардкода-4-часа)
4. [G3 — Адаптивный радиус и «ближайшее жало»](#g3--адаптивный-радиус-и-ближайшее-жало)
5. [G2 — Слой эха на карте](#g2--слой-эха-на-карте)
6. [G4 — Обзор города на дальнем зуме](#g4--обзор-города-на-дальнем-зуме)
7. [G5 — Активное пустое состояние и первооткрыватель](#g5--активное-пустое-состояние-и-первооткрыватель)
8. [G6 — Камера-first первый запуск](#g6--камера-first-первый-запуск)
9. [G7 — Баннер кампании и «час улья»](#g7--баннер-кампании-и-час-улья)
10. [G8 — Инвайты, deep links, вейтлист](#g8--инвайты-deep-links-вейтлист)
11. [G9 — Шаринг жала наружу](#g9--шаринг-жала-наружу)
12. [G10 — Push-уведомления](#g10--push-уведомления)
13. [G11 — Бейдж партнёрского аккаунта](#g11--бейдж-партнёрского-аккаунта)
14. [G12 — Клиентская аналитика](#g12--клиентская-аналитика)
15. [G13 — Сота и зажигание улья](#g13--сота-и-зажигание-улья)
16. [i18n](#16-i18n)
17. [Требования к интеграции с API](#17-требования-к-интеграции-с-api)
18. [Пошаговый план реализации](#18-пошаговый-план-реализации)
19. [Риски](#19-риски)
20. [Приёмочный чек-лист](#20-приёмочный-чек-лист)
21. [Вне скоупа](#21-вне-скоупа)

---

## 1. Что фронтенд обязан обеспечить

Проблема холодного старта у Hive не решается только трафиком: ценность зависит от плотности жал в видимой области карты, а TTL 4 часа делает пустую карту состоянием по умолчанию при малой базе (арифметика — `BACKEND_GROWTH_TZ.md` §1.2). Задача клиента — **никогда не показывать пустую карту как норму** и дать пользователю действия вместо тупика.

| Канал / модель роста                        | Что требуется от приложения                                   |
| ------------------------------------------- | ------------------------------------------------------------- |
| Атомарный запуск в одном районе             | Честный TTL зоны (§G1), обзор города при отзуме (§G4)         |
| Событийные запуски и «час улья»             | Баннер кампании с таймером (§G7), пуш о старте (§G10)         |
| Ценность при нуле других пользователей      | Свои жала и достижения в профиле (§G5), эхо своих мест (§G2)  |
| Инвайты и сообщества (чаты домов, кампусов) | Экран приглашений, share-ссылка, deep link с атрибуцией (§G8) |
| Виральность контента наружу                 | Кнопка «поделиться» с веб-превью (§G9)                        |
| Удержание, не зависящее от плотности        | Пуши о реакциях и активности рядом (§G10)                     |
| Решения о расширении по данным              | События аналитики со снапшотом плотности (§G12)               |

Три механики, критичные именно для первых пользователей: **§G1** (жало в пустом районе живёт до 72 часов), **§G3** (пустой вьюпорт расширяется, а не отдаёт пустоту), **§G5** (пустая карта — это призыв опубликовать, а не сообщение об отсутствии контента).

---

## 2. Состояние репозитория на момент ТЗ

Что уже есть и переиспользуется (не писать заново):

| Есть                          | Где                                                                                                      | Как используется в этом ТЗ                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Пассивный баннер пустой карты | `src/components/map/MapContainer.tsx` (`isEmpty`), ключи `map.emptyTitle` / `map.emptyMessage`           | Заменяется активным пустым состоянием (§G5)                                              |
| Пустое состояние ленты        | `app/(tabs)/nearby.tsx` (`ListEmptyComponent`), ключи `nearby.empty*`                                    | Дополняется CTA и расширенным радиусом (§G3, §G5)                                        |
| Запрос жал по bbox            | `src/hooks/useStingsNearby.ts`, `src/api/stings.ts`                                                      | Расширяется параметрами `minResults` / `includeEchoes`                                   |
| Таймеры                       | `src/hooks/useCountdown.ts`, `src/components/ui/Timer.tsx`                                               | Работают от `expiresAt`, менять не нужно (§G1)                                           |
| WS-менеджер и кэш             | `src/api/websocket.ts`, `src/utils/stings-query-cache.ts`                                                | Добавляются события кампаний (§G7); фильтрация кластеров по порогу переписывается (§G13) |
| Порог и визуал улья           | `src/utils/hive.ts`, `src/utils/hive-marker-visual.ts`, `src/components/hive/HiveContributorAvatars.tsx` | Активация переезжает на стадию кластера, порог остаётся только для визуала (§G13)        |
| Онбординг и permissions       | `app/(onboarding)/*`, `src/hooks/useOnboardingSkip.ts`                                                   | Дополняется первым снимком после логина (§G6)                                            |
| Коллекции профиля             | `src/components/profile/ProfileCollectionLayout.tsx`, `ProfileMenuRow`, `app/(modals)/profile/*`         | Переиспользуются для наград и инвайтов (§G5, §G8)                                        |
| Тосты                         | `src/stores/toastStore.ts`, `src/utils/show-toast.ts`                                                    | Награды и результаты действий                                                            |
| Настройки                     | `src/components/profile/ProfileSettingsModal.tsx`, `src/stores/preferencesStore.ts`                      | Тумблеры пушей и слоя эха (§G10, §G2)                                                    |
| Deep links                    | `app/+native-intent.ts`, `scheme: ['hiveapp', 'site.hiveapp.app', …]` в `app.config.ts`                      | Инвайт-ссылки и переходы из пушей (§G8, §G10)                                            |
| i18n                          | `src/i18n/locales/{ru,en}.ts` + схема `types.ts`                                                         | Все новые строки только через схему                                                      |

Новые зависимости (устанавливать через `npx expo install`, версии для SDK 54):

| Пакет                | Версия     | Зачем                                                     |
| -------------------- | ---------- | --------------------------------------------------------- |
| `expo-notifications` | `~0.32.17` | Пуши (§G10)                                               |
| `expo-device`        | `~8.0.10`  | Проверка «реальное устройство» перед запросом push-токена |
| `expo-clipboard`     | `~8.0.8`   | Копирование инвайт-кода (§G8)                             |

Шаринг ссылок делается через core-API React Native `Share.share({ message, url })`. `expo-sharing` не подходит: он предназначен для файлов, а не URL.

---

## G1 — Фактический TTL вместо хардкода «4 часа»

**Цель:** в разреженной зоне сервер выдаёт жалу TTL до 72 часов (`BACKEND_GROWTH_TZ.md` §G1). Приложение обязано говорить пользователю правду до съёмки и после публикации, иначе главная механика cold start выглядит как баг.

### Задачи

- `src/api/zones.ts` — новый модуль: `getCurrentZone({ lat, lng })` → `GET /zones/current`.
- `src/hooks/useZoneStatus.ts` — React Query поверх него, ключ `['zone', roundedLat, roundedLng]`, координаты округляются до 3 знаков (иначе каждое дрожание GPS создаёт новый ключ), `staleTime` 5 минут.
- `app/(modals)/preview.tsx` — перед публикацией показывать фактический TTL: «Фото будет на карте 24 часа». Пока `useZoneStatus` грузится — нейтральный текст без числа, не «4 часа».
- `src/hooks/usePublishSting.ts` — читать `ttlSec` и `awards` из ответа `POST /stings` (§G5); тип ответа расширить в `src/types/index.ts`.
- Убрать хардкод «4 часа» из строк: `map.emptyMessage`, `nearby.emptyMessage`, `onboarding.step2Description`, `onboarding.expiresInFourHours` (`src/i18n/locales/ru.ts`, `en.ts`, `types.ts`). Онбординг переформулировать в «Фото живёт от 4 до 72 часов — чем меньше активности рядом, тем дольше», а конкретные числа показывать только там, где известна зона.
- `src/components/ui/Timer.tsx` и `useCountdown` не меняются: они уже считают от `expiresAt`. Проверить формат для интервалов > 24 ч (должно быть «2 дн 4 ч», а не «52:14:03»).

**DoD:** в пустом районе экран предпросмотра обещает 72 часа, и опубликованное жало действительно живёт столько же; ни в одной строке интерфейса не остаётся зашитых «4 часа» как утверждения о всех жалах.

---

## G3 — Адаптивный радиус и «ближайшее жало»

**Цель:** пустой вьюпорт не заканчивается пустым экраном.

### Задачи

- `src/api/stings.ts` — `getNearby` принимает `minResults?` и `maxRadiusM?`, возвращает расширенный `StingsNearbyResponse` (`appliedBounds`, `expanded`, `appliedRadiusM`); новый `getNearest({ lat, lng, limit })` → `GET /stings/nearest`.
- `src/hooks/useStingsNearby.ts` — параметры в опциях хука и **в конце** query key: `['stings', swLat, swLng, neLat, neLng, minResults, includeEchoes]`. Префикс `['stings', …]` обязан сохраниться — на него завязано префиксное сопоставление в `src/utils/stings-query-cache.ts` (WS-обновления), иначе realtime молча перестанет работать.
- Карта запрашивает `minResults: 10`; лента «Рядом» — `minResults: 20` (список терпит больший радиус, чем карта).
- `src/hooks/useNearestSting.ts` — ленивый запрос (`enabled` только когда область пуста), ключ `['sting-nearest', roundedLat, roundedLng]`.
- `MapContainer` — при `expanded: true` показывать неблокирующую плашку «Показано в радиусе {{distance}}» (переиспользовать стиль текущего баннера пустоты).
- Кнопка «Показать ближайшее» (в пустом состоянии §G5): `mapStore.requestMapFocus({ lat, lng, stingId })` — обработка `pendingMapFocus` уже реализована в `MapContainer`, новый механизм фокуса не нужен.
- `app/(tabs)/nearby.tsx` — карточки за пределами исходного вьюпорта помечаются дистанцией (уже есть в `NearbyCard`), над списком — та же плашка радиуса.

**Edge cases:** `distanceM: null` (жал нет вовсе) — кнопку «ближайшее» не показывать, оставить CTA публикации; расширение не должно перетирать регион карты (камера остаётся там, где пользователь её оставил — двигать её можно только по явному тапу).

**DoD:** в районе без жал лента и карта показывают контент из расширенной области с честной подписью радиуса; тап по «Показать ближайшее» перемещает карту к нему; realtime-обновления по WS продолжают работать после изменения query key.

---

## G2 — Слой эха на карте

**Цель:** карта показывает, что место живое, даже когда активных жал сейчас нет.

### Задачи

- `useStingsNearby` передаёт `includeEchoes` (значение — из настройки пользователя, по умолчанию включено); тип `StingEchoCell` добавить в `src/types/index.ts`.
- `src/components/map/EchoMarker.tsx` — приглушённая точка (opacity ~0.35, без аватара и фото), размер по `count`, `tracksViewChanges={false}` после первого рендера. Никакой навигации: тап показывает тост «Здесь было {{count}} моментов за неделю».
- `MapContainer` — рендерить эхо **под** активными маркерами; при непустой области эхо не скрывать (это фон, а не заглушка).
- Тумблер «Показывать эхо» в `ProfileSettingsModal` + поле в `preferencesStore` / `preferences-storage.ts`.
- Отдельно — серверная настройка «участвовать в эхе» (`allowEcho`, `BACKEND_GROWTH_TZ.md` §G9): тумблер в тех же настройках, но пишется через API, а не локально. Не путать: локальный тумблер управляет отображением, серверный — приватностью.

**Ограничения:** эхо приходит агрегированным по ячейке и без фото — не пытаться достроить из него превью или карточку в ленте. Производительность: не более 300 маркеров эха, при большем числе — не рендерить (сервер уже агрегирует, клиент только страхует).

**DoD:** в районе, где жала истекли, карта показывает приглушённые точки с корректным счётчиком; выключенный тумблер полностью убирает слой и параметр из запроса; FPS перетаскивания карты не падает заметно при 300 точках эха.

---

## G4 — Обзор города на дальнем зуме

**Цель:** при отзуме карта не выглядит мёртвой — видно, где в городе и стране есть жизнь.

### Задачи

- `src/api/map.ts` — `getOverview({ bounds, zoom })` → `GET /map/overview`.
- `src/hooks/useMapOverview.ts` — включается при `region.latitudeDelta > OVERVIEW_DELTA_THRESHOLD` (константа в `src/utils/map.ts`, стартовое значение `0.5`), с тем же дебаунсом 300 мс.
- `src/components/map/OverviewClusterMarker.tsx` — крупная точка с числом жал; тап приближает камеру к кластеру (`animateToRegion`), не открывает список.
- `MapContainer` — переключение слоёв: дальний зум показывает обзор и **не** запрашивает `/stings/nearby` (иначе bbox страны потянет бессмысленный объём); близкий зум — текущее поведение. Переключение с гистерезисом, чтобы слои не мигали на границе порога.
- `label` кластера может быть `null` — рендерить только число.

**DoD:** отзум до масштаба страны показывает агрегаты по городам без запроса жал; тап приближает к городу; на границе порога слои не мигают.

---

## G5 — Активное пустое состояние и первооткрыватель

**Цель:** превратить пустоту из сообщения об отсутствии контента в понятное действие.

### 5.1 Пустое состояние карты

Заменить пассивную плашку `isEmpty` в `MapContainer` на `src/components/map/MapEmptyState.tsx`:

| Элемент          | Поведение                                                                     |
| ---------------- | ----------------------------------------------------------------------------- |
| Заголовок        | «Здесь ещё никто не был» — если `zone.isFirstEver`, иначе «Сейчас рядом тихо» |
| Подпись          | Фактический TTL зоны (§G1): «Твоё фото проживёт здесь 72 часа»                |
| CTA 1 (основной) | «Сделать первое фото» → `app/(modals)/camera.tsx`                             |
| CTA 2            | «Показать ближайшее — {{distance}}» → §G3, скрывается при `distanceM: null`   |
| CTA 3            | «Позвать друзей» → экран инвайтов §G8                                         |

Требования: блок не перекрывает кнопки карты (`MapLocationButton`, `MapBookmarkButton`), `pointerEvents` настроены так, чтобы карта под блоком оставалась интерактивной; при появлении жал блок исчезает без анимационного мусора. Аналогичный набор CTA — в `ListEmptyComponent` ленты «Рядом».

### 5.2 Награды первооткрывателя

- `src/api/awards.ts` + `src/hooks/useAwards.ts` — `GET /auth/me/awards` (курсорная пагинация).
- `usePublishSting` — при наличии `awards` в ответе показать тост-поздравление (`showInfoToast`) и haptic `notifyPublishSuccess` (уже есть в `src/utils/haptics.ts`).
- `app/(modals)/profile/awards.tsx` — список наград на `ProfileCollectionLayout` (как `photos.tsx` / `hives.tsx`), пункт в меню профиля через `ProfileMenuRow`, счётчик в статистике профиля (`profile.statsAwards`).
- Пустое состояние экрана наград — тоже CTA: «Опубликуй фото там, где ещё никого не было».

**DoD:** первое жало в незатронутой зоне даёт тост о награде, награда видна в профиле; повторная публикация в той же зоне тоста не даёт; пустая карта показывает работающие CTA, и каждый из них ведёт в нужный экран.

---

## G6 — Камера-first первый запуск

**Цель:** первая сессия должна начинаться с создания, а не с потребления. Пользователь, который сначала опубликовал, видит карту минимум с одной своей точкой.

Ограничение архитектуры: онбординг (`app/(onboarding)/*`) идёт **до** авторизации (`useOnboardingSkip` завершает флоу на `/(auth)/login`), поэтому публикация внутри него невозможна. Первый снимок вставляется сразу после успешного входа.

### Задачи

- Флаг `hasPublishedFirstSting` в `preferences-storage.ts` + `preferencesStore` (локальный, не серверный: это UX-подсказка, а не состояние аккаунта).
- `app/(modals)/first-capture.tsx` — экран одного действия: зачем нужно первое фото, фактический TTL зоны (§G1), кнопка «Сделать фото» → `camera.tsx`, вторичная «Позже».
- Показ ровно один раз: после `setSession` при первом попадании в `(tabs)`, если `hasPublishedFirstSting === false` и онбординг завершён. Реализовать в корневом `app/_layout.tsx` рядом с существующим auth-guard, не внутри экрана карты.
- Флаг ставится в `true` после первой успешной публикации **или** после тапа «Позже» (второй раз экран не показывается — навязчивость дороже конверсии).
- Онбординг: в `step1`–`step3` сместить акцент с потребления на съёмку (тексты в §15), порядок экранов не менять.

**DoD:** новый пользователь после регистрации видит экран первого снимка один раз, доходит до камеры и публикует; повторный запуск экран не показывает; существующий пользователь с публикациями его не видит вовсе.

---

## G7 — Баннер кампании и «час улья»

**Цель:** временная концентрация активности — карта выглядит плотной без роста базы.

### Задачи

- `src/api/campaigns.ts` — `getActive({ lat, lng })`; `src/hooks/useActiveCampaigns.ts`, ключ `['campaigns', roundedLat, roundedLng]`, `staleTime` 60 с.
- `src/api/websocket.ts` — добавить `campaign:started` / `campaign:ended` в union типов события и в `switch` обработчика; реакция — `invalidateQueries({ queryKey: ['campaigns'] })`, без собственного состояния в компонентах (правило `TECH_DOCS.md` §4).
- `src/components/map/CampaignBanner.tsx` — заголовок кампании по `i18nKey`, обратный отсчёт до `endsAt` через `useCountdown`, подпись про бонусный TTL, тап → камера. Позиция — над блоком пустого состояния; одновременно показывается максимум одна кампания (ближайшая по `endsAt`).
- Экран предпросмотра (`preview.tsx`) внутри активной кампании показывает итоговый TTL с бонусом (значение берётся из `zones/current`, не считается на клиенте).
- Пуш `campaign_started` (§G10) ведёт по `hiveapp://campaign/{id}` → карта с раскрытым баннером.

**DoD:** во время активного «часа улья» на карте виден баннер с корректным таймером; после `endsAt` он исчезает по WS без перезапуска приложения; публикация внутри окна показывает увеличенный TTL.

---

## G8 — Инвайты, deep links, вейтлист

**Цель:** дать пользователю прямой способ оживить свою карту и обеспечить атрибуцию приглашений.

### 8.1 Экран приглашений

- `src/api/invites.ts` — `create()`, `getMine()`, `getPublic(code)`.
- `app/(modals)/profile/invites.tsx` — код крупным текстом, «Скопировать» (`expo-clipboard`), «Поделиться» (`Share.share({ message, url })`), счётчик «принято N из M», объяснение бонуса («+2 приглашения за каждого друга, который опубликовал фото»).
- Пункт меню в профиле; вход также из CTA пустой карты (§G5).

### 8.2 Deep link и атрибуция

- Формат ссылки: `https://hive.app/i/{code}` (веб-ссылка для мессенджеров) и `hiveapp://i/{code}` (прямой переход).
- `app/+native-intent.ts` — распознать путь `/i/{code}`, сохранить код и вернуть маршрут регистрации. **Существующая ветка Google OAuth не должна пострадать**: проверка `isGoogleOAuthCallbackPath` остаётся первой, инвайт обрабатывается после неё, а неизвестные пути по-прежнему возвращаются как есть.
- `src/stores/invite-storage.ts` — сохранение `pendingInviteCode` в AsyncStorage (переживает установку → регистрацию). Хранить не более 7 суток.
- `src/stores/authStore.ts` — `register` и `loginWithGoogle` дополняют тело запроса `inviteCode`, если код есть; после успешной регистрации код очищается. Невалидный код регистрацию не ломает (сервер его игнорирует, `BACKEND_GROWTH_TZ.md` §8.2) — клиент не показывает по этому поводу ошибок.
- Экран регистрации при наличии кода показывает подсказку «Вас пригласил {{username}}» из `GET /invites/{code}` (запрос без токена, ошибка — просто не показывать подсказку).
- Universal links (`applinks:` для iOS, `autoVerify` intent filter для Android) — отдельная задача сборки: требует `ios.associatedDomains`, `android.intentFilters` в `app.config.ts` и файлов `apple-app-site-association` / `assetlinks.json` на домене. До их появления `https://hive.app/i/{code}` открывается в браузере и ведёт на установку — это допустимый первый шаг.

### 8.3 Вейтлист (за фича-флагом сервера)

- `useZoneStatus` (§G1) уже возвращает `status`. При `status === 'waitlist'`: экран `app/(modals)/waitlist.tsx` — «Ваш район откроется при {{threshold}} заявках, уже {{currentCount}}», кнопка «Занять место» → `POST /waitlist`, после успеха — состояние ожидания и объяснение, что придёт уведомление.
- Карта и лента при `waitlist` не показывают ошибку, а показывают этот экран как состояние, не как сбой.
- При `WAITLIST_ENABLED=false` сервер всегда отдаёт `open` — экран недостижим; отдельного клиентского флага не вводить (один источник истины).

**DoD:** ссылка-приглашение из мессенджера доводит нового пользователя до регистрации, и в аккаунте фиксируется пригласивший; после регистрации подсказка и код исчезают; Google-вход по инвайт-ссылке продолжает работать (регресс `часть «ТЗ frontend»` §8).

---

## G9 — Шаринг жала наружу

**Цель:** контент должен выходить за пределы приложения и приводить людей, которым он релевантен географически.

### Задачи

- `Sting` в `src/types/index.ts` получает `shareUrl?: string | null`.
- `app/(modals)/sting/[id].tsx` — кнопка «Поделиться» рядом с реакцией/удалением; `Share.share({ message: t('share.message'), url: sting.shareUrl })`. При `shareUrl === null` (автор запретил шаринг) кнопка не рендерится — не показывать неактивную.
- `ProfileSettingsModal` — тумблер «Разрешить делиться моими фото» → `PATCH /auth/me/settings { allowSharing }` через React Query mutation с оптимистичным обновлением и откатом при ошибке.
- Аналитика: событие `share_opened` (§G12) при вызове share-sheet.
- Отмена в системном share-sheet ошибкой не считается (как cancel в Google-флоу, `часть «ТЗ frontend»` §8.3).

**DoD:** ссылка на активное жало открывается в мессенджере с превью и ведёт в приложение (или на установку); при выключенном тумблере кнопка исчезает и `shareUrl` перестаёт приходить.

---

## G10 — Push-уведомления

**Цель:** возвращать пользователя поводами, которые не зависят от текущей плотности карты.

### Рантайм и ограничения SDK 54

- `expo-notifications ~0.32.17`. Пуши (remote notifications) **не работают в Expo Go на Android с SDK 53** — тестировать только на dev client / preview / production build. Локальные уведомления в Expo Go остаются доступны, но продуктовый флоу они не покрывают.
- Токен запрашивается как `Notifications.getExpoPushTokenAsync({ projectId })`, где `projectId` — `Constants.expoConfig.extra.eas.projectId` (уже задан в `app.config.ts`).
- Android 13+: системный запрос разрешения не появится, пока не создан канал уведомлений — `setNotificationChannelAsync('default', …)` вызывается **до** запроса токена.
- Физическое устройство обязательно: на симуляторе push-токен не выдаётся (`expo-device` → `Device.isDevice`), в этом случае молча не запрашивать.
- Плагин `expo-notifications` добавить в `plugins` в `app.config.ts` (иконка/цвет уведомления); изменение требует новой native-сборки.

### Задачи

- `src/api/devices.ts` — `registerDevice({ expoPushToken, platform, deviceId, locale, timezone })`, `unregisterDevice(deviceId)`; `src/api/notifications.ts` — `getSettings()`, `updateSettings(partial)`.
- `src/hooks/usePushNotifications.ts` — единая точка: проверка `Device.isDevice`, канал (Android), текущий статус разрешения, запрос, получение токена, регистрация на сервере. Хук не решает, **когда** спрашивать разрешение — только выполняет.
- Момент запроса разрешения: **после первой успешной публикации** (§G6), с экраном-объяснением «Сообщим, когда на твоё фото отреагируют» — по тому же правилу, что и остальные permissions (`часть «ТЗ frontend»` §5). Не при первом запуске.
- Регистрация токена — после `setSession`; `DELETE /devices/{deviceId}` — в `authStore.logout` до очистки токенов (иначе запрос уйдёт без авторизации).
- Тумблеры типов уведомлений в `ProfileSettingsModal` (реакции, активность рядом, кампании, приглашения, истечение жала) — состояние с сервера, не локальное.
- Обработка нажатия: `addNotificationResponseReceivedListener` в корневом `app/_layout.tsx`; роутинг строго по `data.deeplink` (`hiveapp://sting/{id}`, `hiveapp://campaign/{id}`, `hiveapp://(tabs)`); неизвестный тип → карта, без краша.
- Cold start из уведомления: `getLastNotificationResponseAsync()` — обработать после готовности навигации, иначе переход теряется.
- Уведомление в foreground: показывать баннер, но не перебивать активную камеру (`setNotificationHandler` с проверкой текущего маршрута).

**DoD:** на dev/preview-сборке iOS и Android лайк на своё жало приводит к пушу, тап открывает это жало (в том числе при запуске из закрытого состояния); выключенный тумблер прекращает соответствующие пуши; logout снимает регистрацию устройства; в Expo Go на Android приложение не падает, а показывает понятное сообщение, что нужен dev build.

---

## G11 — Бейдж партнёрского аккаунта

**Цель:** сидинг должен быть видимым и честным — партнёрский контент не маскируется под обычных пользователей (`BACKEND_GROWTH_TZ.md` §G11).

Именованное место заведения, заявка партнёра и загрузка фото зала/фасада из галереи — не этот раздел, а **`часть «Места заведений»`**. Бейдж партнёра на жалах остаётся; витрина места на карте не подменяет фильтр «Ульи».

### Задачи

- `Sting` и `User` в `src/types/index.ts` получают `authorAccountType` / `accountType`: `'personal' | 'partner' | 'official'`.
- Бейдж в `src/components/feed/StingAuthorBadge.tsx`, `NearbyCard`, `app/(modals)/user/[id].tsx` и в `HiveBottomSheet`: небольшая метка «Партнёр» / «Hive» рядом с именем. На маркере карты бейдж не добавлять (размер 38 px, метка нечитаема и ломает `tracksViewChanges`).
- Неизвестное значение типа трактуется как `personal` (forward compatibility).

**DoD:** партнёрское жало помечено в детальном просмотре, ленте, улье и профиле автора; обычные пользователи без метки; неизвестный тип не ломает рендер.

---

## G12 — Клиентская аналитика

**Цель:** решения о запуске в новом районе и о платном трафике принимаются по плотности и удержанию в зоне.

### Задачи

- `src/api/analytics.ts` — `sendEvents(events)` (`POST /analytics/events`, батч до 50).
- `src/hooks/useAnalytics.ts` / `src/utils/analytics-queue.ts` — очередь с буфером в AsyncStorage, отправка пачками при появлении сети (`useNetworkStatus` уже есть), дроп событий старше 24 ч, лимит буфера 500 событий.
- Снапшот плотности: событие `session_start` отправляется по **первому** ответу `/stings/nearby` в сессии, с `stingsInViewport`, `hivesInViewport`, `echoes`, `expanded`. Считать до расширения радиуса, иначе метрика пустых сессий обманет сама себя (`BACKEND_GROWTH_TZ.md` §2).
- Обязательные события клиента: `app_open`, `session_start`, `map_empty_shown`, `empty_cta_tap` (с `props.cta`), `nearest_sting_opened`, `first_sting_published`, `sting_published`, `invite_created`, `share_opened`, `push_opened`, `campaign_banner_shown`, `waitlist_submitted`.
- Запрещено кладать в `props` персональные данные: email, точные координаты пользователя, `authorId`. Гео — только `zoneId`, полученный от сервера.

**DoD:** события доходят батчами, переживают офлайн и перезапуск приложения; `session_start` содержит плотность первого вьюпорта; в payload нет персональных данных.

---

## G13 — Сота и зажигание улья

Серверные правила, формула активации и контракт — `BACKEND_GROWTH_TZ.md` §G13, здесь не дублируются.

**Цель:** на карте улей должен означать людей. Сейчас активация считается по кадрам, поэтому три фото одного пользователя выглядят как улей из одного человека, а `HiveContributorAvatars` в такой карточке показывает один аватар — компонент уже сигнализирует о проблеме (в `HiveNearbyCard` он поэтому и закомментирован). Клиентская задача: развести две сущности визуально и в копирайте, а соло-кластер превратить в приглашение второму человеку.

**Наименование.** Соло-кластер в интерфейсе — **«сота»** (namespace `hive.seed.*`): часть улья, которая ещё не улей. Улей остаётся ульем. Если продукт выберет другое слово («серия», «место»), меняются только строки i18n — ни контракт, ни компоненты от названия не зависят.

### Задачи

- `src/types/index.ts` — `Hive` получает `activationCount`, `contributorsCount`, `stage: 'seed' | 'hive'`, `topContributors`. Неизвестное значение `stage` трактуется как `'hive'` (forward compatibility: лучше показать улей, чем потерять кластер с карты).
- `src/utils/hive.ts` — `isActiveHive` больше не решает по числу фото: предикат принимает `Hive` и опирается на `stage`, с фоллбеком `activationCount >= HIVE_ACTIVATION_THRESHOLD` для ответов без стадии. `HIVE_ACTIVATION_THRESHOLD` остаётся только как параметр визуала (`src/utils/hive-marker-visual.ts` масштабирует маркер от счётчика) и перестаёт быть условием активации.
- `src/hooks/useStingsNearby.ts` — передавать `includeSeeds: true`, параметр — **в конце** query key; префикс `['stings', …]` сохранить (§G3).
- `src/utils/stings-query-cache.ts` — две правки, без которых фото пропадут с карты после включения `includeSeeds`:
  - `upsertHiveInNearbyQueries` фильтрует кластеры через `isActiveHive` и выбрасывает из кэша всё, что не дотянуло до порога, — теперь в кэше должны оставаться кластеры **любой** стадии, а решение о рендере принимает карта;
  - `upsertStingInNearbyQueries` удаляет жало из `stings[]`, если у него есть `hiveId`. Это корректно только при условии, что кластер реально рисуется, поэтому рендер seed-кластеров обязателен, а не опционален.
- `src/components/map/HiveSeedMarker.tsx` — маркер соты: превью последнего фото, бейдж числа фото, приглушённая обводка, **без пульсации** (пульсация — признак живого улья, у соты её быть не должно). `tracksViewChanges={false}` после первого кадра, как у остальных маркеров.
- `src/components/map/MapContainer.tsx` — рендерить соты над слоем эха (§G2) и под ульями; тап открывает тот же `app/(modals)/hive/[id].tsx`. Соло-кластер больше не должен распадаться на несколько перекрывающихся пинов.
- `src/components/hive/HiveDetailContent.tsx` — при `stage === 'seed'`: заголовок и CTA из `hive.seed.*` («Здесь уже есть фото. Добавь своё — появится улей»), таймер формулируется как исчезновение фото, а не как растворение улья (`hive.dissolvesIn` для соты не использовать). Кнопка «Добавить своё фото» остаётся с текущим условием `isInsideHive`.
- `src/components/feed/HiveNearbyCard.tsx` — раскомментировать `HiveContributorAvatars`, но питать их `topContributors` из DTO, а не деталями из `useHiveDetail`; для соты показывать «N фото, один автор» без обещания улья.
- `src/components/hive/HiveContributorAvatars.tsx` — принимать `topContributors` (дедупликация по `authorId` внутри компонента остаётся для экрана улья, где источник — список жал).
- Фильтр «Ульи» (`часть «ТЗ frontend»` §9) — только `stage: 'hive'`. Соты под ним скрыты, иначе фильтр «где сейчас люди» снова начнёт врать.
- Награды (§G5) — типы `hive_ignited` и `hive_founder` в `awards.*`, тост при публикации через существующий механизм `usePublishSting`; отдельного экрана не нужно.
- Аналитика (§G12) — `seedsInViewport` в `session_start`, событие `seed_marker_tap`.

**Ограничения:** клиент не считает участников сам и не пересчитывает порог — единственный источник истины по стадии кластера сервер. Запрашивать `GET /hives/:id` на каждый маркер карты ради авторов запрещено: для этого и добавлен `topContributors`.

**DoD:** три фото одного автора в одной точке показываются сотой с числом фото, а не ульем, и открываются одним тапом; фото второго автора превращает соту в улей по `hive:updated` без перезапуска приложения; ни одно фото не исчезает с карты после включения `includeSeeds`; под фильтром «Ульи» сот нет; в карточке улья аватары участников соответствуют реальному числу авторов.

---

## 16. i18n

Все строки — только через схему `src/i18n/locales/types.ts` + `ru.ts` + `en.ts` (схема типизирована, пропуск ключа не соберётся). Новые пространства:

| Namespace     | Содержимое                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `growth.*`    | Пустые состояния с CTA, плашка радиуса, тост эха, экран первого снимка                                                          |
| `campaign.*`  | Названия и описания кампаний (`campaign.hiveHour`, `campaign.event`), таймер, бонус TTL                                         |
| `invite.*`    | Экран приглашений, подсказка «Вас пригласил», вейтлист                                                                          |
| `awards.*`    | Названия наград (`awards.zoneFirst`, `awards.zoneRevival`, `awards.hiveIgnited`, `awards.hiveFounder`), тосты, пустое состояние |
| `hive.seed.*` | Сота: заголовок, число фото, CTA «добавь фото — появится улей», таймер исчезновения фото (§G13)                                 |
| `push.*`      | Экран-объяснение разрешения, тумблеры настроек, сообщение про необходимость dev build                                           |
| `share.*`     | Текст сообщения при шаринге                                                                                                     |
| `sting.ttl*`  | Формулировки TTL: «на карте {{hours}} ч», «на карте {{days}} дн»                                                                |

Правки существующих ключей (убрать утверждение про 4 часа как общее правило): `map.emptyMessage`, `nearby.emptyMessage`, `onboarding.step2Description`, `onboarding.expiresInFourHours`, `onboarding.step1Description` (акцент на съёмку).

Правило копирайта: пустая карта формулируется как возможность («Стань первым здесь»), а не как отсутствие контента («Ничего не найдено»). Числа TTL и радиуса подставляются через интерполяцию, а не зашиваются в строку.

---

## 17. Требования к интеграции с API

- Контракты — только из `BACKEND_GROWTH_TZ.md` / `openapi.yaml`. Типы `src/types/index.ts` расширяются согласованно; предпочтительна генерация из OpenAPI (`TECH_DOCS.md` §1.7).
- Серверные данные — только в React Query. Zustand — исключительно локальные флаги (`hasPublishedFirstSting`, показ слоя эха) и авторизация. Настройки уведомлений и `allowSharing` живут на сервере и в Zustand **не** дублируются.
- Ключи запросов: `['zone', lat, lng]`, `['sting-nearest', lat, lng]`, `['map-overview', bounds, zoom]`, `['campaigns', lat, lng]`, `['invites', 'me']`, `['awards']`, `['notification-settings']`. Префикс `['stings', …]` у `useStingsNearby` менять нельзя (§G3); `includeSeeds` добавляется в конец ключа (§G13).
- Стадия кластера (`stage`) и число участников приходят с сервера. Клиент не пересчитывает порог активации и не выводит участников из списка жал на карте (§G13).
- Координаты в ключах округляются до 3 знаков (~100 м), иначе кэш бесконечно растёт от дрожания GPS.
- Новые эндпоинты вызываются с обычным `Authorization` через существующий `src/api/client.ts`; `skipAuthRefresh` — только для публичного `GET /invites/{code}`.
- Ошибки — через `getApiErrorMessage` / `src/utils/api-error.ts`. Новые коды в `errors.*`:

| `error.code`              | UX                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `FEATURE_DISABLED`        | Экран/кнопка не показывается; не тост об ошибке                                          |
| `INVITE_EXPIRED`          | «Приглашение больше не действует» на экране регистрации, регистрация продолжается        |
| `INVITE_LIMIT_REACHED`    | «Лимит приглашений исчерпан» на экране инвайтов                                          |
| `WAITLIST_ALREADY_JOINED` | Показать состояние ожидания, не ошибку                                                   |
| `RATE_LIMITED`            | Существующий ключ, дополнительно блокировать кнопку до истечения `details.retryAfterSec` |

- Ни одна механика роста не должна ломать текущее поведение: `useStingsNearby` без новых параметров работает как раньше (сервер обеспечивает совместимость, клиент не обязан передавать `minResults`).

---

## 18. Пошаговый план реализации

| Шаг     | Задачи                                                                                                                                                                                | Зависимости                         | DoD                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| **F0**  | Сверить контракты с `BACKEND_GROWTH_TZ.md`, расширить `src/types/index.ts`, завести namespace-заготовки в `types.ts`/`ru.ts`/`en.ts`                                                  | B0–B1 на бэкенде (или staging-моки) | Проект компилируется, типы совпадают с ответами staging                               |
| **F1**  | §G1: `src/api/zones.ts`, `useZoneStatus`, TTL в `preview.tsx`, чистка хардкода «4 часа», формат таймера > 24 ч                                                                        | F0, B1                              | В пустой зоне интерфейс обещает и показывает 72 ч                                     |
| **F1b** | §G13: предикат активации по `stage`, `includeSeeds` в `useStingsNearby`, правки `stings-query-cache.ts`, `HiveSeedMarker`, копирайт соты, аватары из `topContributors`, фильтр «Ульи» | F0, B14                             | Соло-кластер показывается сотой, фото с карты не исчезают, переход в улей виден по WS |
| **F2**  | §G3: `minResults` в `useStingsNearby` (сохранив префикс ключа), `getNearest`, `useNearestSting`, плашка радиуса на карте и в ленте                                                    | F0, B2                              | Пустой район отдаёт контент из расширенной области; WS-обновления не сломаны          |
| **F3**  | §G5: `MapEmptyState` с тремя CTA, то же в `ListEmptyComponent` ленты, тост награды, экран `profile/awards.tsx`, счётчик в статистике                                                  | F1, F2, B5                          | Пустая карта даёт работающие действия; награда за первое жало видна                   |
| **F4**  | §G6: флаг `hasPublishedFirstSting`, экран `first-capture.tsx`, подключение в `app/_layout.tsx`, правка текстов онбординга                                                             | F1                                  | Новый пользователь один раз проходит первый снимок                                    |
| **F5**  | §G2: `EchoMarker`, `includeEchoes`, тумблеры отображения и `allowEcho`                                                                                                                | F0, B3                              | Эхо видно в истёкшем районе, тумблер работает, карта не тормозит                      |
| **F6**  | §G4: `useMapOverview`, `OverviewClusterMarker`, переключение слоёв с гистерезисом                                                                                                     | F0, B4                              | Отзум показывает города; `/stings/nearby` на дальнем зуме не вызывается               |
| **F7**  | §G10: `expo-notifications` + плагин + dev build, `usePushNotifications`, регистрация/снятие устройства, экран-объяснение после первой публикации, тумблеры, диплинки и cold start     | F4, B6                              | Пуш о реакции доходит и открывает жало на обеих платформах                            |
| **F8**  | §G8: экран инвайтов, share/clipboard, deep link в `+native-intent.ts` (регресс Google OAuth), `pendingInviteCode`, `inviteCode` в register/google, подсказка на регистрации           | F0, B7                              | Приглашение доводит до регистрации с атрибуцией                                       |
| **F9**  | §G9: кнопка шаринга на `sting/[id]`, тумблер `allowSharing`, событие `share_opened`                                                                                                   | F0, B8                              | Ссылка разворачивается превью и ведёт в приложение                                    |
| **F10** | §G7: `useActiveCampaigns`, `CampaignBanner`, WS-события кампаний, TTL с бонусом в предпросмотре                                                                                       | F1, F7, B9                          | «Час улья» виден с таймером и исчезает по WS                                          |
| **F11** | §G12: очередь аналитики, снапшот плотности, обязательные события                                                                                                                      | F2                                  | События доходят батчами и переживают офлайн                                           |
| **F12** | §G11: бейджи партнёрских аккаунтов                                                                                                                                                    | F0, B11                             | Партнёрский контент помечен во всех списках                                           |
| **F13** | §G8 вейтлист: экран `waitlist.tsx` по `status` зоны                                                                                                                                   | F1, B12                             | При включённом флаге сервера экран работает, при выключенном недостижим               |
| **F14** | Ручной регресс по чек-листу §19 на физических iOS и Android (dev/preview)                                                                                                             | F1–F13                              | Чек-лист закрыт                                                                       |

Порядок F1 → F1b → F2 → F3 → F4 неслучаен: это минимальный набор, после которого приложение перестаёт выглядеть пустым для первых пользователей. F1b идёт сразу за F1, потому что вместе с TTL до 72 часов соло-кластер держится ульем трое суток, а F3 и F4 прямо подталкивают к одиночным публикациям. Виральность (F8, F9) и пуши (F7) имеют смысл только после этого набора — иначе трафик приходит на пустую или недостоверную карту.

---

## 19. Риски

- **Смена query key у `useStingsNearby`** ломает префиксное сопоставление в `src/utils/stings-query-cache.ts`, и realtime тихо перестаёт работать (без ошибок в консоли). Проверять регрессом: публикация со второго устройства появляется на карте первого.
- **Пуши требуют native-сборки и новых прав.** В Expo Go на Android их нет с SDK 53; добавление плагина `expo-notifications` требует пересборки, а на iOS — APNs-ключа в EAS credentials. Планировать вместе со сборкой, а не как чисто JS-задачу.
- **Разрешение на уведомления, запрошенное на первом запуске**, отказывается чаще и не возвращается без походов в настройки. Отсюда правило «после первой публикации».
- **Deep links в `+native-intent.ts`** — общий вход с Google OAuth redirect. Неаккуратная ветка на инвайты сломает вход через Google (`часть «ТЗ frontend»` §8): порядок проверок и регресс обязательны.
- **Universal links** требуют домена, AASA/assetlinks и новой сборки; до этого веб-ссылка открывается браузером — конверсия ниже, но канал работает.
- **Эхо и длинный TTL — приватность.** Клиент обязан честно показывать TTL до публикации и давать быстрый доступ к удалению жала и к тумблерам `allowEcho` / `allowSharing`.
- **Пропавшие фото при включении `includeSeeds`.** `stings-query-cache.ts` удаляет жало из `stings[]` по наличию `hiveId`, а кластеры фильтрует по старому порогу. Если включить параметр, не поправив обе функции, фото соло-кластеров исчезнут с карты молча — без ошибок в Metro. Регресс: три своих фото в одной точке остаются видимыми.
- **Соло-улей как визуальный долг.** Пока активация считается по кадрам, каждая механика §G5 и §G6 увеличивает число фальшивых ульев: первые пользователи публикуют в одиночку, и карта учит их, что улей — это просто «много фото». Переучивать после релиза дороже, чем сделать F1b сразу.
- **Производительность карты.** Эхо, обзорные кластеры и маркеры жал одновременно — риск просадки FPS на Android. Держать `tracksViewChanges={false}` после первого кадра и не рендерить слои, не относящиеся к текущему зуму.
- **Вейтлист.** Экран «район закрыт» на старте способен обнулить входящий трафик. Управляется только сервером и включается осознанно.

---

## 20. Приёмочный чек-лист

Прогонять на dev client / preview на физических iOS и Android.

- [ ] В районе без активности предпросмотр обещает 72 часа, и жало живёт столько же
- [ ] Нигде в UI не осталось «жала живут 4 часа» как общего утверждения
- [ ] Таймер жала с TTL 72 ч отображается корректно («2 дн 4 ч»)
- [ ] Пустая карта показывает CTA: съёмка, ближайшее жало, приглашение — все три работают
- [ ] «Показать ближайшее» перемещает камеру к жалу в другом районе; при полном отсутствии жал кнопка скрыта
- [ ] Плашка «показано в радиусе N км» появляется только при расширении
- [ ] Публикация со второго устройства появляется на карте первого в реальном времени (регресс WS после смены query key)
- [ ] Первое жало в новой зоне даёт тост награды; награда есть в профиле; повторное — не даёт
- [ ] Три своих фото в одной точке показываются сотой с числом фото, а не ульем, и все три видны в списке
- [ ] Фото второго пользователя превращает соту в улей без перезапуска приложения (WS), приходит тост награды
- [ ] После включения `includeSeeds` ни одно фото не исчезло с карты и не отрисовалось дважды
- [ ] Под фильтром «Ульи» соты не показываются; аватары участников в улье соответствуют числу авторов
- [ ] Экран первого снимка показывается один раз и не возвращается после «Позже»
- [ ] Эхо видно в истёкшем районе, без фото и без автора; тумблер полностью убирает слой
- [ ] Отзум до страны показывает кластеры городов; жала при этом не запрашиваются
- [ ] Баннер «часа улья» виден с таймером, исчезает по WS, предпросмотр показывает бонусный TTL
- [ ] Инвайт-ссылка из Telegram доводит до регистрации, подсказка «вас пригласил» видна, атрибуция зафиксирована
- [ ] Вход через Google после правок `+native-intent.ts` работает (полный регресс `часть «ТЗ frontend»` §8.10)
- [ ] Просроченный инвайт-код не мешает зарегистрироваться
- [ ] Кнопка шаринга даёт ссылку с превью; при `allowSharing=false` кнопки нет
- [ ] Разрешение на пуши запрашивается после первой публикации, с экраном-объяснением
- [ ] Пуш о реакции открывает нужное жало из свёрнутого и из закрытого приложения
- [ ] Тумблеры уведомлений выключают соответствующие типы; logout снимает регистрацию устройства
- [ ] В Expo Go на Android приложение не падает, а объясняет необходимость dev build
- [ ] События аналитики уходят батчами, переживают офлайн; `session_start` содержит плотность вьюпорта
- [ ] В аналитике нет email, точных координат и `authorId`
- [ ] Партнёрские жала помечены бейджем в ленте, улье, детальном просмотре и профиле
- [ ] `npm run lint` и `npx tsc --noEmit` проходят без ошибок

---

## 21. Вне скоупа

- Личные сообщения, комментарии и подписки на пользователей
- Веб-версия приложения и SEO-страницы (публичная share-страница — на бэкенде, §G9)
- Sign in with Apple / Facebook (остаются заглушками, `часть «ТЗ frontend»` §8.11)
- Атрибуция платных установок (SKAdNetwork, Install Referrer), интеграция MMP
- A/B-тестирование текстов и порогов на клиенте
- Лидерборды, уровни, внутренняя валюта (кроме наград §G5)
- Фоновая геолокация и гео-фенсинг для пушей: сервер таргетирует только по зонам публикаций (`BACKEND_GROWTH_TZ.md` §G10)
- Локальные (offline) уведомления как замена push при отсутствии dev build
- Места заведений, заявка партнёра и галерея фото места — **`часть «Места заведений»`** (не расширять §G11 бейджем «как будто это улей»)

---

# Часть 4. Места заведений и партнёры

# Hive — ТЗ: места заведений и самопубликация партнёров

Версия: 0.5  
Публикация места — самообслуживание заведения. Нет ИНН, нет текстового адреса, нет геокодера, нет approve админа, нет SMS-кода и нет фото для проверки точки. Чтобы создать место, достаточно названия, категории, текущей геолокации и email. Телефон и сайт необязательны. Центр — свежий GPS устройства в момент «Опубликовать место», не пин на карте и не снимок. На карточке одна обложка, не ряд галереи. Описание и соцсети правятся в редакторе места, как «О себе» в профиле.  
Стек: backend Node.js + Express + MongoDB + Socket.io (`hive-backend-nodejs`); frontend Expo SDK 54 (`часть «ТЗ frontend»`)  
Смежные документы: `BACKEND_GROWTH_TZ.md` (§G11, §G13), `часть «Привлечение пользователей»` (§G11, §G13), `TECH_DOCS.md`, `openapi.yaml`  
Коды механик: **G14** (самопубликация партнёра), **G15** (места / Place). Нумерация продолжает ряд G1–G13.

Этот документ — продуктовый контракт мест. Реализованные пути сверены с клиентом и `hive-backend-nodejs` и кратко повторены в `TECH_DOCS.md` §3.4–§3.5. Сервер ещё принимает `kind=gallery` и `PATCH /places/{id}/media/order`, но клиент эти вызовы не делает.

---

## Содержание

1. [Зачем это продукту](#1-зачем-это-продукту)
2. [Инварианты — что нельзя ломать](#2-инварианты--что-нельзя-ломать)
3. [Сущности и роли](#3-сущности-и-роли)
4. [G14 — Самопубликация партнёра](#g14--самопубликация-партнёра)
5. [G15 — Места заведений](#g15--места-заведений)
6. [Обложка места](#6-обложка-места)
7. [Связь места с ульем и картой](#7-связь-места-с-ульем-и-картой)
8. [API-контракты](#8-api-контракты)
9. [Frontend](#9-frontend)
10. [Модерация, жалобы, антифрод](#10-модерация-жалобы-антифрод)
11. [Приватность, хранение, сторы](#11-приватность-хранение-сторы)
12. [Аналитика и метрики](#12-аналитика-и-метрики)
13. [Пошаговый план](#13-пошаговый-план)
14. [Риски](#14-риски)
15. [Приёмочный чек-лист](#15-приёмочный-чек-лист)
16. [Вне скоупа](#16-вне-скоупа)

---

## 1. Зачем это продукту

Кафе и бары — естественные точки концентрации людей. Сейчас партнёр (§G11) может только сидить район живыми жалами: без имени, без лица заведения, без постоянного присутствия на карте. Улей при этом **нельзя отдать заведению во владение**: по §G13 улей означает «здесь собрались люди», а не «здесь есть бизнес».

Нужна отдельная сущность **место (Place)**:

- заведение видно на карте даже в тихий час;
- у места есть имя и **одна обложка** из библиотеки или камеры (витрина, а не «я здесь сейчас»);
- когда гости снимают на точке, обычный улей зажигается **поверх** места и наследует его лицо;
- сидинг и витрина не рисуют плотность и не подделывают улей.

Библиотека разрешена **только** для обложки места. Это осознанное исключение из правила «на карту — только камера». Ряда галереи в клиенте нет. Hive **не** проверяет юрлицо, **не** собирает текстовый адрес и **не** одобряет заявку до публикации. Имя и фото — на совести заведения. Точка места — геолокация телефона в момент публикации (§4.3). Чужое или фейковое место снимается после жалобы (§10), а не очередью ревью.

---

## 2. Инварианты — что нельзя ломать

| # | Инвариант | Следствие |
| --- | --- | --- |
| I1 | Жало на карте по-прежнему только из in-app камеры + анти-спуфинг (`TECH_DOCS.md` §5.3) | `POST /stings` не принимает файл из галереи ни для `personal`, ни для `partner` |
| I2 | Улей зажигается только по §G13 | Фото места не входят в `activationCount`, не создают `seed`/`hive`, не триггерят `nearby_activity` |
| I3 | Кластер только из `partner`/`official` в разрезе «без сидинга» ульём не считается (`BACKEND_GROWTH_TZ.md` §G13) | Витрина места это не компенсирует и не обходит |
| I4 | Медиа места **никогда** не становятся `Sting` | Нет `expiresAt`, нет эха (§G2), нет `share/stings/{id}` |
| I5 | Фейковые «живые» аккаунты запрещены (§G11) | Партнёр не маскируется под обычного пользователя; бейдж обязателен |
| I6 | Центр места — текущая геолокация в момент публикации | Не текст адреса, не перетаскиваемый пин и не GPS фотографии. Партнёр центр после создания не двигает |
| I7 | Гость без самопубликации не выкладывает витрину | Обложку грузит owner после самопубликации (`accountType=partner`) или `official`, пока место не `suspended`. «Партнёр» здесь значит «заведение само опубликовало точку», не «Hive проверил ИНН» |

Нарушение I1–I4 превращает карту в каталог заведений с нарисованной жизнью. Это хуже пустой карты.

---

## 3. Сущности и роли

### 3.1 Роли

| Роль | Кто | Что может |
| --- | --- | --- |
| Заявитель | `personal`, заполняет форму | Черновик заявки. Место на карту не публикует, пока сам не отправит форму |
| Партнёр | `accountType=partner` сразу после своей отправки | Ведёт места, ставит обложку из библиотеки или камеры, пишет «О месте» и соцсети, публикует живые жала как сейчас (§G11). Юрлицо Hive не проверяет |
| Official | команда Hive | Создаёт место через admin без заявки; те же ограничения I1–I4 |
| Гость | любой авторизованный | Видит место, снимает жало в радиусе (камера), открывает карточку |
| Админ | роль `admin` | Не одобряет заявку заранее. Suspend места, снятие медиа по жалобе, ручной `account-type` как сейчас |
| Сотрудник заведения | — | **Вне скоупа.** Одно место — один owner-аккаунт |

`accountType` не расширяется новыми значениями. Пока форма не отправлена, заявитель остаётся `personal`. Отдельного статуса «ждёт админа» нет.

Существующий `POST /admin/users/{id}/account-type` остаётся **аварийным переключателем** (уже выданные партнёры, Hive-аккаунты). Обычный путь — самопубликация §G14. Админ, выставивший `partner` вручную, всё равно не создаёт место без названия, категории и координат.

### 3.2 Модели

```ts
type UUID = string;

type PlaceCategory = 'cafe' | 'bar' | 'restaurant' | 'other';
type ApplicationStatus = 'draft' | 'published';

interface PartnerApplication {
  id: UUID;
  userId: UUID;
  brandName: string;          // вывеска / как зовут гости; заявитель отвечает за правдивость
  category: PlaceCategory;
  address: PlaceAddress;
  phone: string | null;       // E.164, необязательный контакт. Код по SMS не отправляется
  contactEmail: string;       // обязателен для submit
  listingUrls: {
    instagram: string | null; // в форме не собирается, на месте остаётся null
    website: string | null;   // необязателен
    ymaps: string | null;     // в форме не собирается
    twogis: string | null;    // в форме не собирается
  };
  onsite: OnsiteVerification | null; // в пути публикации не используется
  status: ApplicationStatus;
  placeId: UUID | null;        // заполняется при самопубликации, когда место создано
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface PlaceAddress {
  formatted: string;          // может быть пустым. Текстовый адрес для публикации не нужен
  city: string | null;        // не собирается
  country: string | null;     // не собирается
  lat: number | null;         // текущая геолокация на submit; до этого null
  lng: number | null;
  source: 'declared' | 'onsite' | 'manual_admin'; // самопубликация пишет declared
}

interface OnsiteVerification {
  verifiedAt: string;
  lat: number;
  lng: number;
  accuracyM: number;
  photoUrl: string;           // private; камера, анти-спуфинг как у жала
  distanceToAddressM: number;
}

type PlaceStatus = 'draft' | 'live' | 'paused' | 'suspended';
type MediaKind = 'cover' | 'gallery';
type MediaSource = 'library' | 'camera';
type MediaModeration = 'approved' | 'rejected';

interface Place {
  id: UUID;
  ownerId: UUID;
  applicationId: UUID | null; // null у official, созданных админом
  name: string;
  category: PlaceCategory;
  description: string | null; // до 280. В редакторе подпись «О месте», многострочное поле как bio профиля
  address: PlaceAddress;
  phone: string | null;       // контакт с заявки. В публичный PlaceSummary не входит
  center: { lat: number; lng: number }; // GPS публикации, read-only для партнёра
  radiusM: number;            // конфиг, не поле формы. Старт 60
  cover: PlaceMedia | null;
  gallery: PlaceMedia[];      // сервер хранит kind=gallery, клиент не показывает и не грузит
  socialLinks: UserSocialLinks; // instagram, telegram, tiktok, youtube, website. Пустые не показываются
  hiveId: UUID | null;        // текущий живой кластер в радиусе, иначе null
  hiveStage: HiveStage | null;
  activeGuestStingsCount: number; // только personal-авторы, не истёкшие
  status: PlaceStatus;
  verifiedAt: string | null;  // null: Hive юрлицо не проверял. Момент самопубликации — publishedAt заявки
  createdAt: string;
  updatedAt: string;
}

interface PlaceMedia {
  id: UUID;
  placeId: UUID;
  kind: MediaKind;
  source: MediaSource;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  sortOrder: number;
  moderation: MediaModeration;
  rejectCode: 'quality' | 'not_this_place' | 'people_sensitive' | 'stolen' | 'other' | null;
  exifGps: { lat: number; lng: number } | null;
  exifCapturedAt: string | null;
  createdAt: string;
}

interface PlaceSummary {
  id: UUID;
  name: string;
  category: PlaceCategory;
  center: { lat: number; lng: number };
  radiusM: number;
  coverThumbnailUrl: string | null;
  hiveId: UUID | null;
  hiveStage: HiveStage | null;
  activeGuestStingsCount: number;
  status: 'live';             // в публичных выдачках только live
}
```

Константы (env/config, не литералы в клиентской логике):

| Ключ | Старт | Смысл |
| --- | --- | --- |
| `PLACE_RADIUS_M` | 60 | Радиус привязки жал и показа «внутри места» |
| `PLACE_RADIUS_MIN_M` / `MAX_M` | 30 / 100 | Если админ поправит радиус под летнюю веранду |
| `PLACE_CLAIM_RADIUS_M` | 75 | Насколько админ может сдвинуть центр. К текстовому адресу не привязано: адреса нет |
| `PLACE_ONSITE_ACCURACY_MAX_M` | 50 | Только для неиспользуемого on-site эндпоинта. Публикация его не проверяет |
| `PLACE_GALLERY_MAX` | 12 | Серверный лимит `kind=gallery`. Клиент слоты не открывает |
| `PLACE_MEDIA_MAX_BYTES` | 15 × 1024 × 1024 | До клиентского ресайза |
| `PLACE_MAX_PER_PARTNER` | 3 | Места, которые уже выходили на карту: live, скрытые и снятые. Черновик без обложки в лимит не входит. Повторное «Опубликовать» обновляет тот же черновик |
| `PLACE_OVERLAP_MIN_M` | 40 | Минимальная дистанция центров двух live/draft мест разных владельцев |

`Hive` DTO дополняется опциональными полями (старые клиенты игнорируют):

```ts
interface Hive {
  // …существующие поля §G13
  placeId?: UUID | null;
  place?: PlaceSummary | null;
}
```

`Sting` DTO — опционально `placeId?: UUID | null` (для карточки «снято в …»). Не использовать как замену `hiveId`.

---

## G14 — Самопубликация партнёра

### Задача

Обложка места обходит анти-спуфинг съёмки. Hive не переносит доверие на ИНН, геокодер или человека в ревью: **заведение само заявляет имя и фото и само за них отвечает**. Украденная витрина снимается жалобой и suspend (§10), а не предварительным approve.

До пина остаётся один автоматический барьер — свежая геолокация и соседство:

| Барьер | Вопрос | Как закрывается |
| --- | --- | --- |
| Точка | Где сейчас стоит телефон | GPS в теле `submit`, `source=declared` |
| Сосед | В этой точке уже есть чужое место | `PLACE_OVERLAP` по центрам, без ревьюера |

ИНН, свидетельство, текстовый адрес, подсказки геокодера, ограничение страны `RU`, SMS-код, фото фасада и решение админа до публикации **не** входят в путь. Автоподтверждение по ЕГРЮЛ/ЕГРИП — тоже не входит (см. §16).

### 4.1 Пользовательский сценарий

```
профиль → «Для заведений» → список мест и «Создать место» → заявка
  → название, категория, текущая геолокация, email
  → телефон и сайт по желанию
  → «Опубликовать место» → сразу accountType=partner, Place в draft, center = этот GPS
  → редактор места: обложка из библиотеки или камеры → Place live сразу, без очереди модерации
```

Онбординг обычного пользователя не меняется. Пункт профиля «Для заведений» открывает список мест и «Создать место» и у `personal`, и у `partner`. Отдельного экрана «на проверке / отказано» нет: отправка сама создаёт место.

`partner` не видит форму заявки повторно, пока не начнёт заявку на **следующее** место (лимит `PLACE_MAX_PER_PARTNER`).

### 4.2 Форма заявки

| Поле | Правила |
| --- | --- |
| `brandName` | Обязательно. 2–80, это имя места на карте |
| `category` | Обязательно. `cafe` / `bar` / `restaurant` / `other` |
| текущая геолокация | Обязательно. `lat`/`lng` в теле `submit`. Карта на форме только показывает точку, её нельзя перетащить |
| `contactEmail` | Обязательно. Может отличаться от email аккаунта |
| `phone` | Необязателен. Пустое значение submit не блокирует. E.164, если заполнен. SMS нет |
| `website` | Необязателен |
| `address.formatted`, город, страна | Не собираются и для submit не нужны. Пустая строка допустима |
| Instagram, Яндекс.Карты, 2ГИС | В форме нет. На заявке и месте остаются `null` |

Юрлица, ИНН и документов нет. Копирайт под формой: «Вы публикуете место от своего имени. Hive не проверяет документы заведения».

`source` самопубликации — `declared`. `onsite` в этот путь не входит. `manual_admin` — только если админ поправил центр уже созданного места.

### 4.3 Где вы сейчас

В момент «Опубликовать место» клиент берёт свежую геолокацию (`foreground`, `Balanced`) и шлёт её в `POST /partner/applications/{id}/submit` как `{ lat, lng }`. Сервер записывает её в заявку и в `Place.center` до проверки полноты. Отдельное фото фасада не требуется и центр не задаёт.

Отказ в разрешении геолокации или таймаут фикса — клиент не вызывает `submit`. Точность `PLACE_ONSITE_ACCURACY_MAX_M` на этом шаге не применяется.

`POST /partner/applications/{id}/onsite` остаётся в API, но экран заявки туда не ведёт и `submit` поле `onsite` не читает.

После отправки партнёр центр не двигает. Админ может поправить его в пределах `PLACE_CLAIM_RADIUS_M`.

### 4.4 Самопубликация

Отдельного `POST /admin/partner-applications/{id}/review` нет. Место создаёт `POST /partner/applications/{id}/submit`.

`submit` атомарно, если есть название, категория, координаты и email и нет overlap:

1. `users.accountType = partner` (если ещё не partner).
2. `PartnerApplication.status = published`, `publishedAt = now`, `placeId` созданного места.
3. Создаётся `Place` в `draft`: имя = `brandName`, центр = `lat`/`lng` из тела submit (`source=declared`), `address.formatted` может быть пустым, телефон с заявки или `null`, `verifiedAt = null`.
4. Награды §G5 не выдаются.

Не хватает названия, категории, точки или email → `422 APPLICATION_INCOMPLETE`, `details.missing` содержит только эти поля (`brandName`, `category`, `address.point`, `contactEmail`). Текстовый адрес, on-site, телефон и ссылки в `missing` не входят. Место не создаётся, аккаунт остаётся `personal`.

Снять партнёрку по злоупотреблению: `POST /admin/users/{id}/account-type { personal }` + `suspended` всем live-местам. Не удалять медиа сразу — см. §11. Это реакция на жалобу, не шаг онбординга.

### 4.5 Конфликт претензий

Индекс уникальности live-мест: гео. Одна сеть — несколько мест, если центры дальше `PLACE_OVERLAP_MIN_M`.

Если центр новой заявки ближе `PLACE_OVERLAP_MIN_M` к уже `live`/`draft` чужому месту → `409 PLACE_OVERLAP`, `submit` не проходит. Спор «это наше заведение» — ручной тикет, перевод `ownerId` админом (`POST /admin/places/{id}/transfer`) — в MVP достаточно эндпоинта, UI нет.

Две заявки на одну точку: первая успешная `submit` побеждает; вторая — `overlap`.

### 4.6 DoD §G14

Заявитель получает `partner` и draft-место без ИНН, без текстового адреса, без геокодера, без SMS-кода, без фото фасада и без решения админа. Обязательны название, категория, текущая геолокация и email. Пустой телефон submit не блокирует. `verifiedAt` остаётся `null`. Центр равен GPS из тела `submit`.

---

## G15 — Места заведений

### Задача

Дать заведению постоянное именованное присутствие на карте и карточку с фото, не подменяя улей.

### 5.1 Жизненный цикл Place

```
draft  --(cover uploaded)-->  live
live   --(owner pause)-->     paused
paused --(owner resume)-->    live
*      --(admin)-->           suspended
```

| Статус | На карте | Карточка по прямой ссылке | Медиа |
| --- | --- | --- | --- |
| `draft` | нет | только owner | можно грузить |
| `live` | да | да | да |
| `paused` | нет | «временно скрыто» для чужих, owner видит | да |
| `suspended` | нет | 404/`PLACE_SUSPENDED` | read-only |

Переход в `live` **только** если: owner `partner`|`official`, есть обложка, статус не `suspended`. Обложка публикуется сразу, очередь модерации не ждёт. Без обложки пин не публикуем — иначе серый маркер без лица, это не «фото заведения».

Пауза — хозяин уехал в отпуск / ремонт. Suspend — нарушение. Resume из `suspended` только админ.

Удаление места: owner не стирает `live` и `paused` (риск скрыть жалобы). С карты их убирает `POST /places/{id}/pause`: статус `paused`, `pauseReason=owner`, у соты и улья этого места `placeId` обнуляется, branded-обложка с маркера сходит. Вернуть — `resume`. `DELETE /places/{id}` разрешён только для `draft`: удаляются документ, его `PlaceMedia` и файлы. Иначе `422 PLACE_NOT_DRAFT`. Хард-делит опубликованного места — админ, после срока хранения §11. Скрытое место по-прежнему входит в `PLACE_MAX_PER_PARTNER`.

### 5.2 Что партнёр редактирует сам

Можно: `name`, `description` (до 280, в UI «О месте»), `socialLinks` (`instagram`, `telegram`, `tiktok`, `youtube`, `website`; пустое поле скрыто, `@username` сервер разворачивает в URL), `phone`, одна обложка, пауза, удаление черновика. Категорию `PATCH` принимает, редактор её не показывает: она задаётся в заявке.

Нельзя: `center`, `radiusM`, `ownerId`, `status=suspended`, безвозвратное удаление `live`/`paused`. Текстовый адрес для переноса точки не используется. Точка переехала — новая заявка с новым GPS или тикет админу.

Обложка стоит в редакторе сразу, с иконкой камеры как у фото профиля. Отдельного экрана «Фото места» нет. Нажатие: «Снять» или «Выбрать из галереи». Долгое нажатие или пункт «Удалить фото» снимает обложку; у `live` это уводит место в `paused` (`cover_missing`).

Лимит мест: `PLACE_MAX_PER_PARTNER`. Создание второго места — новая заявка §G14 с новой геолокацией, не кнопка «клонировать».

### 5.3 Публичная карточка места

Экран `app/(modals)/place/[id].tsx`:

1. Обложка.
2. Имя, категория, бейдж «Заведение». Бейдж значит «опубликовано заведением», не «проверено Hive».
3. Дистанция от пользователя, если есть GPS. Отдельной строки текстового адреса нет.
4. Текст `description`, если он не пустой.
5. Соцсети чипами. Пустые не рисуются. Нажатие открывает URL. Instagram скрыт, если клиентский флаг `instagramLinksAllowed` выключен.
6. Кнопка «Снять здесь» → камера; если пользователь вне `radiusM` — предупреждение «жало привяжется к месту, только если снять на точке» (сервер всё равно решит по GPS публикации).
7. Живые гостевые фото — те же данные, что улей, если `hiveId != null`; иначе пустое состояние «Пока тихо — стань первым» + CTA камеры. Обложку в этот ряд не подставлять.
8. Ссылка «Открыть улей», если `hiveStage === 'hive'`.
9. «Скрыть с карты» — только owner и только `live`.
10. «Пожаловаться» открывает нижний лист причин, не системный `Alert`. Лист закрывается «Отмена», затемнением и системной кнопкой назад. На Android `Alert` с пятью кнопками назад не отпускает.

Гостевые фото — `GET /places/{id}/stings` (только активные, `authorAccountType=personal` по умолчанию, партнёрские — отдельным флагом `includePartner=true`, default false). Так витрина сидинга не выглядит как очередь гостей.

### 5.4 QR и диплинк

`hiveapp://place/{id}` и `https://hive.app/p/{id}` (публичная OG-страница по образцу §G9: обложка и имя). QR партнёр шарит из редактора места. Это основной способ зажечь улей вечером: стол → камера Hive.

Инвайт-коды §G8 не подменяем: диплинк места не обязан быть инвайтом с квотой. Атрибуцию «пришёл из места» пишем в аналитику (`place_deeplink_opened`).

---

## 6. Обложка места

### 6.1 Что можно брать из библиотеки

| Медиа | Библиотека | Камера приложения | Попадает на карту как жало |
| --- | --- | --- | --- |
| Обложка места | да, один кадр | да | нет |
| Дополнительные фото места | клиент не предлагает | клиент не предлагает | нет. Сервер ещё принимает `kind=gallery` |
| Документы заявки | — | — | нет. Документы не собираем |
| Проверка адреса фотографией | не входит в публикацию | не входит в публикацию | нет |
| Живые жала партнёра и гостей | **нет** | только камера | да |

Клиент для обложки: «Снять» / «Выбрать из галереи», `selectionLimit: 1`. Пикер открывается через ~350 мс после закрытия диалога, иначе iOS его не показывает. Ресайз — тот же пайплайн, что `prepareStingPhotoForUpload` (короткая сторона ≤ 1920, jpeg 0.82). EXIF GPS можно сохранить, на публикацию он не влияет. Ориентацию по-прежнему запекать.

Разрешение Photo Library запрашивать в момент выбора, не заранее. Usage string (Info.plist / Play): отдельный от аватара смысл — «чтобы загрузить фото заведения». Для обычных пользователей формулировка аватара не должна обещать загрузку мест.

### 6.2 Почему библиотека допустима только для обложки

Доверие к кадру = заявление заведения (§G14) и жалоба после публикации (§10). Сток, чужой интерьер, рендер с сайта остаются риском и лежат на совести загрузившего. Запрет библиотеки для единственной обложки убьёт партнёров: нормальный кадр зала снят на другой телефон. Ряд галереи клиент не собирает.

### 6.3 Публикация медиа

Клиент шлёт только `kind=cover`. Сервер по-прежнему принимает `kind=gallery` и `PATCH /places/{id}/media/order`, но приложение эти пути не вызывает и `gallery[]` на карточке не рисует.

Каждый `PlaceMedia` сразу получает `moderation=approved` и обложка отдаётся в публичных `GET /places`, `places[]` и OG. Очереди «на проверке» нет. EXIF не решает, показывать ли фото.

Технический порог: `image/jpeg` после конвертации, short side ≥ 800, иначе `MEDIA_TOO_SMALL`.

Админ снимает кадр только после жалобы: `POST /admin/place-media/{id}/review { decision: "reject", rejectCode? }`. Reject виден owner с i18n по `rejectCode`. Если у live-места не осталось обложки — место автоматически `paused` с причиной `cover_missing`, и `Hive.placeId` этого места обнуляется.

Удаление обложки: owner может удалить её из редактора. Нельзя оставить live-место без cover: удаление обложки уводит место в `paused`.

### 6.4 Водяные знаки, люди, сток

Отдельного детекта лиц нет (вне скоупа). Копирайт в редакторе: «Загружайте фото своего заведения. Не чужие снимки и не скриншоты. За фото отвечаете вы». Жалоба `stolen` / `not_this_place` снимает кадр или место после решения по жалобе (§10). Повторные снятия → suspend места и отзыв `partner` на усмотрение админа.

---

## 7. Связь места с ульем и картой

### 7.1 Привязка жала

При `POST /stings` сервер ищет live `Place`, в радиусе которого точка съёмки. Если несколько (не должно при `PLACE_OVERLAP_MIN_M`) — ближайший центр. Пишет `sting.placeId`.

Жало вне всех мест: `placeId=null`, поведение как сейчас.

Партнёрское жало внутри своего места тоже получает `placeId`, но:

- не увеличивает `activeGuestStingsCount`;
- не даёт вклад в `activationCount` сверх действующих правил §G13 (кап автора остаётся; в разрезе без сидинга партнёр не считается).

### 7.2 Привязка улья

Когда кластер пересчитывается (создание/истечение/удаление жала), если `hive.center` внутри live-места — `hive.placeId = place.id`, у места `hiveId` / `hiveStage` обновляются. Выход всех жал или уход центра — поля обнуляются. Пауза, пропажа обложки и удаление черновика тоже снимают `Hive.placeId`, иначе сота продолжает показывать обложку скрытого места. `hive:updated` несёт `placeId` и `place` summary, чтобы маркер сменил вид без рефетча.

Не создавать улей «из пустого места». Нет гостевых жал — нет улья, есть только пин места.

### 7.3 Слой на карте

`GET /stings/nearby` дополняется:

```json
{
  "stings": [],
  "hives": [],
  "places": [ /* PlaceSummary, только live, обложка есть */ ],
  "echoes": [],
  "appliedBounds": {}
}
```

Правила рендера (`MapContainer`):

1. Эхо (§G2) — самый низ.
2. Соты и одиночные жала — как сейчас.
3. Ульи — как сейчас; если `hive.placeId` задан, маркер **branded**: обложка места внутри шестиугольника + счётчик. Пульсация только при `stage=hive`.
4. Пины мест — для live-мест, у которых **нет** активного `hiveId` на карте. Если улей/сота этого места уже рисуется, отдельный пин места **не** дублировать.
5. Сота (`seed`) в радиусе места: branded seed (обложка + приглушённая заливка, без пульсации), пин места скрыт.

Тап по пину места без улья → `place/[id]`. Тап по branded улью/соте → `hive/[id]` (там шапка места + ссылка на карточку). Не открывать оба модала сразу.

Фильтр «Ульи» (`часть «ТЗ frontend»` §9): по-прежнему только `stage=hive`. Пины тихих мест **скрыты**. Иначе фильтр «где люди» врёт витринами. Отдельный чип «Места» — вне скоупа MVP.

Обзор города §G4: места в overview **не** кластеризуем на MVP (иначе страна покроется кафе при нулевой жизни). На дальнем зуме остаются агрегаты жал.

Лимит пинов мест в одном viewport: 100; если больше — ближайшие к центру камеры, остальные отбрасываются (как страховка эха на 300).

### 7.4 Карточка улья

`HiveDetailContent`: если `place` есть — шапка с обложкой, именем, бейджем «Заведение», вход в `place/[id]`. Список жал не смешивать с обложкой места.

Копирайт соты на месте: «Снимись в {name} — появится улей» (`place.seedCta`).

### 7.5 TTL и кампании

Публикация в радиусе места **не** даёт сама по себе бонус TTL. Бонус по-прежнему: плотность зоны §G1, активный улей §G13, кампания §G7.

Партнёр может попросить «час улья» на точку — это существующий `POST /admin/campaigns` с `geo.center = place.center`. Отдельного self-serve кампаний в MVP нет.

---

## 8. API-контракты

Базовый префикс `/api/v1`. Ошибки — единый `{ error: { code, message, details } }`. Все пути ниже, кроме публичных GET места/диплинка, требуют Bearer. Admin — роль `admin`.

### 8.1 Заявки партнёра

| Метод | Путь | Назначение |
| --- | --- | --- |
| POST | `/partner/applications` | Создать `draft` (1 активный `draft` на пользователя) |
| GET | `/partner/applications/me` | Текущая/последние заявки пользователя |
| PATCH | `/partner/applications/{id}` | Поля формы, пока `draft` |
| POST | `/partner/applications/{id}/onsite` | Не используется публикацией. Контракт кадра сохранён, `submit` его не требует |
| POST | `/partner/applications/{id}/submit` | Тело `{ lat, lng }`. Создаёт Place `draft`, если есть название, категория, точка и email |

`submit` без `brandName` / без категории / без `lat`+`lng` / без email → `422 APPLICATION_INCOMPLETE`, `details.missing: string[]` из `brandName`, `category`, `address.point`, `contactEmail`. Текстовый адрес, on-site, телефон, город и ссылки в `missing` не входят. Пустой `address.formatted` валиден и не даёт `VALIDATION_ERROR`. Эндпоинтов SMS нет.

### 8.2 Admin мест

Очереди заявок нет. Админ реагирует на уже опубликованное место.

| Метод | Путь | Назначение |
| --- | --- | --- |
| POST | `/admin/places/{id}/suspend` | `{ reason }` |
| POST | `/admin/places/{id}/unsuspend` | вернуть в `paused` (owner сам включит live) |
| POST | `/admin/places/{id}/transfer` | `{ newOwnerId }` — оба должны быть partner |
| POST | `/admin/place-media/{id}/review` | только `reject` уже опубликованного медиа по жалобе |
| POST | `/admin/places` | Создать место для `official` без заявки. Обязательны имя, категория и `center`. Текстовый адрес не обязателен |

`POST /admin/users/{id}/account-type` не меняется.

### 8.3 Места

| Метод | Путь | Auth | Назначение |
| --- | --- | --- | --- |
| GET | `/places/nearby` | Bearer | Можно не делать отдельным, если `places[]` в `/stings/nearby` |
| GET | `/places/{id}` | Bearer | Публичная карточка; скрытых pending-медиа нет |
| GET | `/places/{id}/stings` | Bearer | Активные жала с `placeId`, cursor; `includePartner` default false |
| GET | `/places/me` | Bearer | Места owner |
| PATCH | `/places/{id}` | owner | name, description (≤280), category, phone, `socialLinks` целиком. Клиент шлёт name, description, phone и соцсети; категорию не меняет. Центр не меняется |
| POST | `/places/{id}/pause` | owner | live→paused, `Hive.placeId` этого места обнуляется |
| POST | `/places/{id}/resume` | owner | paused→live, если обложка есть |
| DELETE | `/places/{id}` | owner | Только `draft` → 204. Иначе `422 PLACE_NOT_DRAFT` |
| POST | `/places/{id}/media` | owner | multipart `photo` + `kind=cover\|gallery` + `source=library\|camera`. Клиент шлёт только `cover` |
| PATCH | `/places/{id}/media/order` | owner | `{ galleryIds: UUID[] }`. Клиент не вызывает |
| DELETE | `/places/{id}/media/{mediaId}` | owner | Снятие обложки у live → `paused` / `cover_missing` |

`GET /stings/nearby` — добавить `places?: PlaceSummary[]`. Параметр `includePlaces` default **true**, чтобы старый клиент, который поле игнорирует, ничего не сломал, а новый мог выключить.

`GET /hives/{id}` — `hive.place` если привязан.

Публичная HTML: `GET /share/places/{id}` (не под `/api/v1`), OG: title=name, image=cover. `paused`/`suspended`/`draft` → 404.

### 8.4 Коды ошибок (новые)

`APPLICATION_INCOMPLETE`, `APPLICATION_NOT_EDITABLE`, `ONSITE_LOW_ACCURACY`, `ONSITE_VALIDATION_FAILED`, `PLACE_OVERLAP`, `PLACE_LIMIT`, `PLACE_NOT_LIVE`, `PLACE_NOT_DRAFT`, `PLACE_SUSPENDED`, `PLACE_RESUME_NEEDS_COVER`, `MEDIA_LIMIT`, `MEDIA_TOO_SMALL`, `MEDIA_NOT_OWNER`, `COVER_REQUIRED`, `NOT_PARTNER`.

### 8.5 Rate limits

| Ресурс | Лимит |
| --- | --- |
| Создание заявок | 3 / сутки / user |
| Submit | 10 / сутки |
| On-site | 10 / сутки |
| Place media | 20 / сутки / user |
| Pause/resume | 10 / сутки |
| Жалоба на место | 5 / сутки / user |

### 8.6 WebSocket

Новые события не обязательны для MVP: карточка места не realtime-критична. Достаточно:

- существующий `hive:updated` с `placeId` / `place`;
- инвалидация `['places', id]` и nearby при загрузке обложки — через обычный refetch при фокусе.

Опционально позже: `place:updated`. Не блокирует MVP.

---

## 9. Frontend

Expo SDK 55: камера и ImagePicker — по [документации версии](https://docs.expo.dev/versions/v55.0.0/). Не писать native-модули. Выбор обложки — `src/utils/pick-place-image.ts`, один кадр, `source: camera | library`.

### 9.1 Экраны

| Путь | Кто | Содержание |
| --- | --- | --- |
| `app/(modals)/partner/apply.tsx` | personal | Форма: название, категория, превью текущей геолокации, email. Телефон и сайт по желанию |
| `app/(modals)/partner/onsite.tsx` | — | В путь публикации не входит |
| `app/(modals)/partner/places.tsx` | все | «Для заведений»: список, «Создать место», с карты убирается корзиной |
| `app/(modals)/partner/place/edit.tsx` | owner | Обложка с иконкой правки, имя, «О месте», соцсети, телефон, пауза, удаление черновика, QR. Открывается сразу после submit |
| `app/(modals)/place/[id].tsx` | все | Публичная карточка: обложка, описание, соцсети, гости, жалоба листом |
| Профиль | все | Пункт «Для заведений» ведёт в `partner/places`, не сразу в заявку |

Кнопка публикации не открывает камеру жала и не ведёт на `onsite.tsx`.

### 9.2 Карта

- `src/components/map/PlaceMarker.tsx` — обложка в скруглённом шестиугольнике, обводка цвета соты (`SEED_FILL`), без счётчика и без пульсации. На Android кадр снимается в PNG (`PlaceMarkerCapture`) и отдаётся в `Marker.image`, иначе системный снимок маркера обрезает фото.
- `HiveCircle` / `HiveMarkerFace` — вариант `place`: fill картинкой, поверх count. `tracksViewChanges={false}` после загрузки обложки (Android).
- `useStingsNearby` / типы `StingsNearbyResponse.places`.
- `useFilteredMapMarkers` — места участвуют только в фильтре `all` (и будущем `places`, которого нет). Под `hives`/`fresh`/`expiring` тихие пины мест скрыты; branded улей под `hives` остаётся, потому что это улей.

Пустое состояние карты не менять на «нет заведений». Место — бонус, не замена CTA съёмки §G5.

### 9.3 Состояние и API-слой

- `src/api/partner.ts`, `src/api/places.ts`.
- React Query: `['partner-application']`, `['places', 'me']`, `['place', id]`, `['place-stings', id, cursor…]`.
- Zustand не хранит места — серверные данные.
- i18n: namespaces `partner.*`, `place.*`, `errors.ONSITE_*`, `errors.PLACE_*`, `errors.APPLICATION_*` в `ru.ts` / `en.ts` / `types.ts` одним изменением.

### 9.4 Permissions и сторы

- On-site и жала: camera + location, как сейчас.
- Медиа места: photo library **опционально**. Отказ library не блокирует камеру для обложки.
- App Store: обновить цель Photo Library в privacy nutrition и `privacy-policy.*` — библиотека больше не «только аватар», а «аватар и, для заведений, фото места». Это обязательный сопутствующий артефакт релиза G15, не «потом».

### 9.5 DoD frontend

После submit партнёр сразу в редакторе места и ставит одну обложку из библиотеки или камеры; обложка видна на карте без очереди модерации; гость не может открыть picker библиотеки в камере жала; публикация места не создаёт sting; branded улей не дублирует пин места. Экрана ожидания ревью и экрана галереи нет.

---

## 10. Модерация, жалобы, антифрод

### 10.1 Жалобы

```
POST /places/{id}/reports { "reason": "not_a_place" | "wrong_location" | "stolen_photos" | "spam" | "other", "comment"? }
```

После 3 принятых админом жалоб за 30 дней — авто-`paused` + очередь на suspend. Порог — конфиг `PLACE_REPORT_PAUSE_THRESHOLD`. Это единственный вход админа в уже живое место.

Жалоба на конкретное медиа: `POST /places/{id}/media/{mediaId}/reports`.

### 10.2 Что система не пытается решить сама

- Обратный поиск картинок / TinEye.
- OCR вывески vs `brandName`.
- Верификация через Госуслуги / ЭЦП.

Первый год жалобы разбирает человек уже после публикации. Автоматика до пина только: свежий GPS в `submit`, overlap, rate limit. После пина — порог жалоб.

### 10.3 Злоупотребления и ответы

| Атака | Защита |
| --- | --- |
| Поставил точку не там, где заведение | Центр — GPS телефона в момент публикации. Жалоба `wrong_location`; suspend |
| Чужое фото интерьера | Витрина на совести заведения; жалоба `stolen_photos` |
| Соседняя дверь ближе 40 м | Overlap; жалоба `wrong_location`; suspend |
| Галерея людей без согласия | Жалоба + reject `people_sensitive`; TOS |
| Партнёр ставит чужую обложку, место «живое» | Витрина не улей и не плотность; тихий пин без гостей; жалоба |
| Подделка живой карты жалами из галереи | I1, без исключений для partner |
| Накрутка улья сотрудниками | §G13 кап автора; несколько аккаунтов — уже риск продукта, не решаем здесь; репорт |
| Заявка на чужую известную точку | Overlap, если место уже есть. Если нет — пин встанет, пока не придёт жалоба. Это принятый риск самопубликации |

---

## 11. Приватность, хранение, сторы

| Данные | Где | Срок |
| --- | --- | --- |
| On-site proof | private object storage | пока партнёрство + 3 года; после снятия партнёрки — 90 дней |
| Обложка | public CDN как жала, но другой prefix `places/` | пока место не hard-delete |
| Телефон заведения, email контакта | Mongo, доступ admin/owner | как заявка. SMS не отправляется |
| EXIF GPS медиа | не отдавать в публичный DTO | пока медиа живо |

Публичный `Place` / `PlaceSummary` **не** содержит телефон, on-site фото, `exifGps`. ИНН и документов в системе нет.

Удаление аккаунта owner (`DELETE /auth/me`): места → `suspended`, медиа снять с CDN в том же джобе, что жала; заявки анонимизировать по правилам текущей политики. Не оставлять витрину «сирот» на карте.

Обновить `legal/privacy-policy.ru.md`, `en.md`, `legal/privacy-policy.ts`:

- библиотека: аватар **и** фото заведения;
- отдельная категория: телефон точки и on-site кадр (не публичная витрина);
- цель: карточка места и привязка координат;
- не смешивать с «моментами карты».

---

## 12. Аналитика и метрики

События клиента (в батч §G12, без точных координат):

`partner_apply_started`, `partner_onsite_succeeded`, `partner_application_submitted`, `place_cover_uploaded` (`props.source: library|camera`), `place_went_live`, `place_card_opened`, `place_deeplink_opened`, `place_report_submitted`, `place_seed_cta_tap`. События загрузки галереи нет.

Серверные разрезы (§G12 density):

- `placesInViewport` в `session_start` (live пины, не считая те, что скрыты branded-ульем);
- `viewportDensity` **не** включает места;
- отдельная метрика `placeLiveCount` по зоне, `placeGuestStings24h`, доля мест с `hiveStage=hive`.

Решение «заведение приносит жизнь» принимается по гостевым жалам и зажжённым ульям, не по числу обложек.

---

## 13. Пошаговый план

Календарные сроки не закладываются. Порядок — чтобы обложка не появилась на карте раньше якоря координат.

### Backend

| Шаг | Что | Зависимости | DoD |
| --- | --- | --- | --- |
| **B0** | Модели Application/Place/PlaceMedia, private+public storage prefixes, конфиг констант | — | Индексы: ownerId, 2dsphere center, status+expires не нужен |
| **B1** | CRUD заявки: название, категория, текущий GPS, email. Телефон и сайт необязательны. Текстовый адрес не требуется | B0 | Submit без одного из четырёх полей — `APPLICATION_INCOMPLETE`. Пустой телефон проходит. Геокода, ИНН и SMS нет |
| **B2** | Снят | — | SMS-кода нет, шаг не реализовывать |
| **B3** | Снят для публикации | — | Фото фасада не якорь координат. Эндпоинт `/onsite` не блокирует `submit` |
| **B4** | `submit` принимает `{ lat, lng }`, ставит `partner` и создаёт Place `draft` с пустым `formatted` | B1 | Без названия, категории, точки или email место не создаётся. Admin review и OTP нет |
| **B5** | Media upload library/camera, сразу `approved`, live при наличии обложки | B4 | Публичный GET отдаёт обложку сразу |
| **B6** | `placeId` на sting/hive, `places[]` в nearby, share HTML | B5 | Нет двойного рендера в контракте (поле hive.place) |
| **B7** | Reports, auto-pause, suspend/transfer, снятие медиа, DELETE account cascade | B5 | Soft-hide |
| **B8** | OpenAPI + TECH_DOCS §3.4 Places / §3.5 Partner | B6 | Контракт совпал с этим файлом |

### Frontend

| Шаг | Что | Зависимости | DoD |
| --- | --- | --- | --- |
| **F0** | Типы, api-модули, i18n, пункт в профиле | B1 контракт | Сборка |
| **F1** | Форма заявки: название, категория, превью GPS, email | B1 | Без этих четырёх полей submit не уходит. Экрана кода и текстового адреса нет |
| **F2** | Снят | — | Отдельная камера проверки адреса в путь не входит |
| **F3** | После submit сразу редактор места | B4 | Нет экрана submitted / rejected |
| **F4** | Редактор места: обложка, «О месте», соцсети, пауза, удаление черновика | B5 | Library не открывается в камере жала; кадр виден без «на проверке» |
| **F5** | Публичная карточка, диплинк, QR share | B6 | Гостевой ряд ≠ обложка |
| **F6** | Маркеры мест + branded hive/seed, фильтры | B6 | Нет дубля пин+улей; «Ульи» без тихих мест |
| **F7** | Жалоба, пауза, privacy-policy строки | B7 | Чеклист §15 |
| **F8** | Аналитика событий §12 | F5–F6 | Нет GPS в props |

Admin UI для заявок нет: заявку админ не одобряет. Suspend и снятие медиа — существующий канал вызова `/admin/*`.

Параллелить можно F0–F1 с B1; F4 не начинать до B5 (иначе загрузка обложки упрётся в 404).

---

## 14. Риски

- **Библиотека как дыра в I1.** Любой экран, где ImagePicker стоит рядом с публикацией жала, размоет границу. Обложка места и `POST /stings` — отдельные модули, у жала нет `source=library`.
- **Чужая витрина до жалобы.** Раз approve и SMS нет, сток и чужой бар могут постоять на карте, пока кто-то не пожалуется. Это принятый обмен: быстрее публикация, позже снятие. Suspend и порог жалоб (§10) — единственный ответ.
- **Точка с дивана.** GPS телефона можно включить не в заведении. Текстового адреса, с которым это можно сверить, нет. Жалоба `wrong_location`.
- **Сети и фудкорты.** Несколько точек в одной галерее ТЦ ближе 40 м — конфликт. Админ снижает `PLACE_OVERLAP_MIN_M` точечно или правит радиусы, не партнёр.
- **Ложный улей у бара.** Сотрудники снимают с личных аккаунтов. Это уже §G13, не баг мест; в карточке места гостевой ряд честный, если `includePartner=false`.
- **App Review.** Расширение Photo Library без правки privacy nutrition — риск реджекта. Делать вместе с F7.
- **Доверие карты.** Если продуктово когда-нибудь «покажем галерею как жала» — прямой запрет I4, эскалировать как breaking change, не хотфикс.

---

## 15. Приёмочный чек-лист

- [ ] `personal` не открывает загрузку медиа места и не видит «выбрать из галереи» в камере жала
- [ ] Заявка не submit без названия, категории, текущей геолокации и email. Текстовый адрес, фото фасада, ИНН, документы и SMS не требуются. Пустой телефон submit не блокирует и не даёт `VALIDATION_ERROR`
- [ ] Пустой `address.formatted` сохраняется. `Place` создаётся с `source=declared`
- [ ] `submit` без админа ставит `accountType=partner`, Place `draft`, `verifiedAt=null`, center = GPS из тела запроса
- [ ] Одна обложка из библиотеки или камеры сразу в публичном GET и на карте, без очереди модерации. Клиент не предлагает второй ряд фото
- [ ] Place без обложки не `live` и не попадает в `places[]`
- [ ] `DELETE /places/{id}` удаляет только `draft`. `live` уходит с карты через pause и остаётся в списке
- [ ] Карточка показывает описание и непустые соцсети. Редактор сохраняет их тем же `PATCH`
- [ ] Гостевое жало в радиусе получает `placeId`; жало партнёра не увеличивает `activeGuestStingsCount`
- [ ] Три фото партнёра в точке места — сота/не улей по §G13, пин места branded seed, плотность без сидинга не растёт
- [ ] Два гостя зажигают улей; маркер становится branded hive, отдельный пин места исчезает
- [ ] Фильтр «Ульи» не показывает тихие места
- [ ] Истечение гостевых жал гасит улей, пин места возвращается
- [ ] Пауза owner скрывает пин; resume без cover — ошибка
- [ ] Suspend админа — 404 чужим, owner read-only
- [ ] Overlap второй заявки в 20 м — `PLACE_OVERLAP`
- [ ] Диплинк/QR открывает карточку; OG содержит обложку и имя
- [ ] Жалоба работает; on-site кадр не отдаётся публично
- [ ] `DELETE /auth/me` owner убирает место с карты
- [ ] Privacy policy и store disclosures упоминают фото заведения из библиотеки (аватар и обложка места)
- [ ] `npm run lint` / `npx tsc --noEmit` после клиентской реализации; OpenAPI синхронизирован

---

## 16. Вне скоупа

- Кабинет сотрудника / несколько ролей на одно место
- Self-serve кампании и «час улья» партнёром (остаётся admin §G7)
- Чип фильтра «Места», поиск заведений, категории на карте как в 2ГИС
- Меню, столы, бронь, оплата, отзывы-звёзды
- Авто-верификация ЕГРЮЛ, Госуслуги, претензия Google/Yandex Business, сбор ИНН
- Импорт фото из Instagram / сайта (это уже не галерея устройства)
- Видео и живые сторис места
- Смена центра места партнёром после публикации
- Показ медиа места в эхе, overview страны, ленте «Рядом» как карточек жала
- Ослабление I1 для партнёрских жал («пусть зальют вечер из галереи на карту»)
- Админ-UI suspend (эндпоинты есть, интерфейс — отдельная задача)
- Награды за «первое место в зоне» и монетизация партнёров (подписка, промопин)

Монетизация и меню имеют смысл только после того, как live-место + гостевой улей работают честно.

---

# Часть 5. Публикация в Google Play

Анализ приложения под требования Google для публикации в Play Market. Сверка на 3 октября 2026.

Сборка на Expo SDK 54 по целевому API уже подходит под порог Play. Публичные страницы политики и удаления аккаунта есть на hive-app.site, и приложение ссылается на них. Ревью в текущем виде не пройдёт из‑за согласия при входе через Google, а не из‑за версии Android или модерации контента.

[Certain] С 31 августа 2026 новые приложения и обновления должны целиться в Android 16 (API 36). Expo SDK 54 по умолчанию ставит compileSdkVersion и targetSdkVersion 36, отдельного понижения в проекте нет. Формат AAB даёт EAS production. 64-бит и поддержка страниц 16 КБ у SDK 54 закрыты; готовый AAB здесь не разбирался. Удаление аккаунта внутри приложения есть: Профиль → Настройки, `DELETE /auth/me`. Покупок нет, отдельная касса Play не нужна. Рекламных SDK нет.

Ниже то, из‑за чего заявку вернут.

Блокеры

1. Вход через Google с экрана логина создаёт аккаунт без согласия. [Certain]

Политика пользовательского контента требует принять правила до создания аккаунта и загрузки контента. На `app/(auth)/register.tsx` галочки политики и правил сообщества стартуют как `useState(false)`. Регистрация по email и кнопка Google на этом экране не проходят без обеих галочек (`onBeforeAuth={ensureConsents}`).

На `app/(auth)/login.tsx` у `AuthSocialLogin` этого предохранителя нет. «Продолжить с Google» вызывает `POST /auth/google`. По контракту это find-or-create: новый пользователь получает сессию, не отмечая политику и правила. Для Play это дыра, даже если экран регистрации сделан правильно.

Уже закрыто, в заявке это больше не блокеры

Публичные URL. [Certain] Политика: https://hive-app.site/policy. Удаление аккаунта: https://hive-app.site/delete-account. В приложении эти адреса стоят в тексте политики. Шаринг инвайтов и мест, Android App Links (`/i`, `/p`) и iOS associated domain смотрят на `hive-app.site`, не на `hive.app`. В консоли эти два URL всё равно нужно вписать вручную. Файлы `public/.well-known/assetlinks.json` и `apple-app-site-association` лежат в репозитории hive-web. Проверка ссылок заработает после деплоя и замены `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` и `REPLACE_WITH_APPLE_TEAM_ID`.

Жалобы и блокировка. [Certain] Карта, профили и подписи — пользовательский контент. В приложении есть жалоба на фото, подпись, профиль и карточку места, отдельная кнопка «Скрыть» на чужом профиле и список скрытых в настройках. Правила сообщества описывают запреты и жалобу из приложения; почта указана как запасной путь, если из приложения пожаловаться не получается.

Микрофон. [Certain] по конфигу, [Guessing] по итоговому манифесту AAB. В `app.config.ts` стоит `blockedPermissions: ['android.permission.RECORD_AUDIO']`, у `expo-camera` и `expo-image-picker` — `microphonePermission: false` и `recordAudioAndroid: false`. Плагин `plugins/with-blocked-microphone.js` вырезает `AudioRecordingService`. Политика при этом говорит, что микрофон не собирается. Смерженный манифест production-сборки не проверялся.

Галочки. [Certain] Согласие с политикой и правилами на регистрации не проставлено заранее. Текст политики с этим совпадает.

Геолокация. [Certain] Экран до системного диалога (`LocationAccessGate`, ключ `onboarding.locationDescription`) говорит, что точные координаты опубликованного фото видят другие пользователи, пока снимок на карте. Фоновой геолокации нет. Камера и точная геолокация «при использовании» для этой карты обоснованы. `READ_MEDIA_IMAGES` на Android 13+ image picker не запрашивает, ограничение Play на широкий доступ к галерее здесь не срабатывает.

Риски, которые часто всплывают уже на ревью

Data safety. [Certain] как требование консоли, форму из кода не видно. В анкете нужно указать точную геолокацию, фото, email, имя, профиль, токен уведомлений, идентификатор установки (`X-Device-Id`), события своей аналитики (`POST /analytics/events`), передачу координат другим пользователям Hive и Яндекс MapKit. Политика эти три пункта — device id, push-токен и свою аналитику — не называет. Расхождение анкеты с фактом и с текстом политики — частая причина отклонения. Рекламы в коде нет: в консоли отметить «без рекламы». Если в смерженном манифесте окажется `AD_ID`, его тоже надо вырезать.

Доступ ревьюера. [Certain] Карта закрыта без аккаунта, регистрация по email ждёт OTP. В разделе App access нужен тестовый логин, иначе ревьюер не пройдёт дальше входа.

Возраст. [Certain] В политике приложение не для детей младше 13, проверки возраста при регистрации нет. В «Для всей семьи» приложение включать нельзя, в аудитории детей не отмечать.

Закрытый тест. [Certain] как правило, [Guessing] про тип аккаунта. Личный аккаунт разработчика, созданный после 13 ноября 2023, перед продом обязан 14 дней держать закрытый тест с 12 участниками. Организация от этого освобождена.

Сборка. [Likely] `YANDEX_MAPKIT_API_KEY` в `eas.json` не задан, только `APP_ENV=production`. Пустой ключ в production-сборке EAS оставит карту пустой, и ревью может снять приложение как нерабочее. Секрет нужно положить в EAS (имя `YANDEX_MAPKIT_API_KEY`), из репозитория его не видно. Google Sign-In на Android завязан на SHA-1 сертификата подписи Play, не на upload-ключ локальной сборки. Карточка магазина (иконка 512, скриншоты телефона, feature graphic 1024×500) в репозитории не собрана.

Итог: в прод эту сборку не примут, пока вход через Google с экрана логина создаёт аккаунт без согласия. В консоль вписать https://hive-app.site/policy и https://hive-app.site/delete-account.
