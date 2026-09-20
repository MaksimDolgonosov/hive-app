# Hive — ТЗ: места заведений и верификация партнёров

Версия: 0.1  
Стек: backend Node.js + Express + MongoDB + Socket.io (`hive-backend-nodejs`); frontend Expo SDK 54 (`RN_FRONTEND_TZ.md`)  
Смежные документы: `BACKEND_GROWTH_TZ.md` (§G11, §G13), `RN_GROWTH_TZ.md` (§G11, §G13), `TECH_DOCS.md`, `openapi.yaml`  
Коды механик: **G14** (верификация партнёра), **G15** (места / Place). Нумерация продолжает ряд G1–G13.

Этот документ — **источник истины** по контрактам и правилам мест. Пока реализация не внесена в `openapi.yaml` / `TECH_DOCS.md`, расхождения решаются в пользу этого файла.

---

## Содержание

1. [Зачем это продукту](#1-зачем-это-продукту)
2. [Инварианты — что нельзя ломать](#2-инварианты--что-нельзя-ломать)
3. [Сущности и роли](#3-сущности-и-роли)
4. [G14 — Верификация партнёра](#g14--верификация-партнёра)
5. [G15 — Места заведений](#g15--места-заведений)
6. [Фото места из галереи](#6-фото-места-из-галереи)
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
- у места есть имя, адрес и **фото интерьера/фасада из галереи** (витрина, а не «я здесь сейчас»);
- когда гости снимают на точке, обычный улей зажигается **поверх** места и наследует его лицо;
- сидинг и витрина не рисуют плотность и не подделывают улей.

Галерея разрешена **только** для медиа места. Это осознанное исключение из правила «на карту — только камера»: доверие к таким фото держится не на EXIF съёмки, а на верификации партнёра (§G14).

---

## 2. Инварианты — что нельзя ломать

| # | Инвариант | Следствие |
| --- | --- | --- |
| I1 | Жало на карте по-прежнему только из in-app камеры + анти-спуфинг (`TECH_DOCS.md` §5.3) | `POST /stings` не принимает файл из галереи ни для `personal`, ни для `partner` |
| I2 | Улей зажигается только по §G13 | Фото места не входят в `activationCount`, не создают `seed`/`hive`, не триггерят `nearby_activity` |
| I3 | Кластер только из `partner`/`official` в разрезе «без сидинга» ульём не считается (`BACKEND_GROWTH_TZ.md` §G13) | Витрина места это не компенсирует и не обходит |
| I4 | Медиа места **никогда** не становятся `Sting` | Нет `expiresAt`, нет эха (§G2), нет `share/stings/{id}` |
| I5 | Фейковые «живые» аккаунты запрещены (§G11) | Партнёр не маскируется под обычного пользователя; бейдж обязателен |
| I6 | Координаты места нельзя задать «с дивана» | Центр Place фиксируется on-site камерой на заявленном адресе, не GPS заявки и не пин, который партнёр подвинул на карте |
| I7 | Неверифицированный пользователь не публикует витрину | Галерея места доступна только после `accountType=partner` (или `official`) и `Place.status`, допускающего медиа |

Нарушение I1–I4 превращает карту в каталог заведений с нарисованной жизнью. Это хуже пустой карты.

---

## 3. Сущности и роли

### 3.1 Роли

| Роль | Кто | Что может |
| --- | --- | --- |
| Заявитель | `personal`, подал заявку | Черновик заявки, загрузка документов, телефон, on-site. Место на карту не публикует |
| Партнёр | `accountType=partner` после approve | Создаёт и ведёт места, грузит обложку/галерею из галереи или камеры, публикует живые жала как сейчас (§G11) |
| Official | команда Hive | Создаёт место через admin без заявки; те же ограничения I1–I4 |
| Гость | любой авторизованный | Видит место, снимает жало в радиусе (камера), открывает карточку |
| Админ | роль `admin` | Ревью заявок, approve/reject, suspend места, ручной `account-type` как сейчас |
| Сотрудник заведения | — | **Вне скоупа.** Одно место — один owner-аккаунт |

`accountType` не расширяется новыми значениями. Промежуточные состояния живут в `PartnerApplication.status`, не в типе аккаунта. Неодобренный заявитель остаётся `personal`.

Существующий `POST /admin/users/{id}/account-type` остаётся **аварийным переключателем** (уже выданные партнёры, Hive-аккаунты). Обычный путь — заявка §G14. Админ, выставивший `partner` вручную, всё равно не сможет показать место на карте без on-site привязки координат (I6).

### 3.2 Модели

```ts
type UUID = string;

type LegalType = 'ip' | 'ooo' | 'self_employed' | 'other';
type PlaceCategory = 'cafe' | 'bar' | 'restaurant' | 'other';
type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'needs_info'
  | 'approved'
  | 'rejected';

interface PartnerApplication {
  id: UUID;
  userId: UUID;
  legalType: LegalType;
  legalName: string;          // как в документах
  inn: string | null;         // 10 или 12 цифр; null только для legalType=other
  brandName: string;          // вывеска / как зовут гости
  category: PlaceCategory;
  address: PlaceAddress;
  phone: string;              // E.164, телефон заведения
  phoneVerified: boolean;
  contactEmail: string;
  listingUrls: {
    instagram: string | null;
    website: string | null;
    ymaps: string | null;     // Яндекс.Карты
    twogis: string | null;
  };
  documents: ApplicationDocument[];
  onsite: OnsiteVerification | null;
  status: ApplicationStatus;
  rejectCode: ApplicationRejectCode | null;
  reviewerNote: string | null; // виден заявителю при needs_info / rejected
  placeId: UUID | null;        // заполняется при approve, когда место создано
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
}

interface PlaceAddress {
  formatted: string;
  city: string;
  country: string;            // MVP: только RU
  lat: number;                // геокод адреса, не GPS телефона заявителя
  lng: number;
  source: 'geocoder' | 'manual_admin';
}

interface ApplicationDocument {
  id: UUID;
  kind: 'signage' | 'inn_cert' | 'lease' | 'menu' | 'other';
  imageUrl: string;           // private bucket, не CDN карты
  createdAt: string;
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
type MediaModeration = 'pending' | 'approved' | 'rejected';

interface Place {
  id: UUID;
  ownerId: UUID;
  applicationId: UUID | null; // null у official, созданных админом
  name: string;
  category: PlaceCategory;
  description: string | null; // до PROFILE_BIO_MAX_LENGTH (280)
  address: PlaceAddress;
  center: { lat: number; lng: number }; // копия onsite-координат, read-only для партнёра
  radiusM: number;            // конфиг, не поле формы. Старт 60
  cover: PlaceMedia | null;
  gallery: PlaceMedia[];      // без cover-дубля; max PLACE_GALLERY_MAX
  socialLinks: UserSocialLinks;
  hiveId: UUID | null;        // текущий живой кластер в радиусе, иначе null
  hiveStage: HiveStage | null;
  activeGuestStingsCount: number; // только personal-авторы, не истёкшие
  status: PlaceStatus;
  verifiedAt: string | null;
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
| `PLACE_CLAIM_RADIUS_M` | 75 | Допуск on-site относительно геокода адреса |
| `PLACE_ONSITE_ACCURACY_MAX_M` | 50 | Как у наград §G5: грубый GPS не принимается |
| `PLACE_GALLERY_MAX` | 12 | Обложка не входит в лимит |
| `PLACE_MEDIA_MAX_BYTES` | 15 × 1024 × 1024 | До клиентского ресайза |
| `PLACE_MAX_PER_PARTNER` | 3 | Каждое место — своя заявка и свой on-site |
| `PLACE_OVERLAP_MIN_M` | 40 | Минимальная дистанция центров двух live-мест |
| `PARTNER_DOCUMENTS_MIN` | 1 | Минимум один документ; для `ip`/`ooo` рекомендуется `inn_cert` или `signage` |

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

## G14 — Верификация партнёра

### Задача

Галерея места обходит анти-спуфинг съёмки. Значит, доверие переносится на проверку: **кто** подаёт, **какое** заведение, **контролирует ли** он точку по заявленному адресу. Без этого шага украденные фото чужого бара окажутся на карте Hive.

Три независимых слоя. Approve только если все три закрыты (для `legalType=other` слой «кто» закрывается ручным ревью вместо ИНН).

| Слой | Вопрос | Как закрывается на MVP |
| --- | --- | --- |
| Идентичность | Кто заявитель и какое юрлицо | Форма + ИНН с контрольной суммой + документ |
| Существование точки | Есть ли заведение по адресу | Адрес через геокодер + ссылка 2ГИС/Яндекс + фото вывески в документах |
| Контроль точки | Это его точка, он там был | Телефон заведения + **on-site камера** (обязательно) + ревью админа |

Автоподтверждение по ЕГРЮЛ/ЕГРИП, претензия листинга Google/Yandex, выезд амбассадора — **не** входят в MVP (см. §16). Первый поток партнёров маленький, человек в ревью дешевле ложной верификации.

### 4.1 Пользовательский сценарий

```
профиль → «Для заведений» → заявка
  → документы (камера или галерея)
  → OTP на телефон заведения
  → on-site: прийти на адрес, снять фасад/вывеску камерой приложения
  → отправка
  → ожидание ревью
  → approved → accountType=partner, создаётся Place в draft
  → обложка из галереи → модерация обложки → Place live
```

Онбординг обычного пользователя не меняется. Вход в заявку — из профиля, только для `personal` без активной заявки (или с `needs_info` / `rejected`, которую можно править).

`partner` не видит форму заявки повторно, пока не начнёт заявку на **следующее** место (лимит `PLACE_MAX_PER_PARTNER`).

### 4.2 Форма заявки

| Поле | Правила |
| --- | --- |
| `legalType` | Обязательно |
| `legalName` | 2–120 символов |
| `inn` | Обязателен для `ip`/`ooo`/`self_employed`. Цифры: 12 (ИП/самозанятый) или 10 (ООО). Сервер считает контрольную сумму ИНН; невалидный → `VALIDATION_ERROR`. Для `other` — `null`, заявка всегда ручная |
| `brandName` | 2–80, это имя места на карте |
| `category` | `cafe` / `bar` / `restaurant` / `other` |
| `address` | Выбор из подсказок геокодера (клиент не шлёт произвольные lat/lng «с пальца»). Сервер перепроверяет геокодом; расхождение > 150 м с подсказкой → ошибка |
| `phone` | E.164, не личный обязательно, но должен быть доступен заявителю для OTP |
| `contactEmail` | Может отличаться от email аккаунта |
| `listingUrls` | Хотя бы одна из `ymaps` / `twogis` / `instagram` / `website` |

Страна адреса на MVP — только `RU`. Иначе `PLACE_COUNTRY_UNSUPPORTED`.

Геокодер: тот же стек, что карта (Яндекс, раз проект уже мигрирует — `YANDEX_MAPKIT_MIGRATION.md`). Конкретный провайдер фиксируется в backend-реализации один раз. Фоллбек админа: `source: 'manual_admin'`.

### 4.3 Документы заявки

Это KYC, не витрина. Источник — камера **или** галерея (скан свидетельства ИНН лежит в «Файлах»/галерее — запрещать бессмысленно).

- multipart, jpeg/heic → jpeg, те же лимиты размера, что у аватара;
- хранение: **private bucket**, не публичный CDN жал;
- `GET` документа — только owner и admin, с краткоживущим signed URL;
- минимум `PARTNER_DOCUMENTS_MIN`; для `ip`/`ooo` ревьюер вправе вернуть `needs_info`, если нет ни `inn_cert`, ни `signage`.

Паспорт не требуем на MVP (152-ФЗ, избыточно для витрины кафе). ИНН + вывеска + on-site.

### 4.4 Телефон заведения

Цель — отсечь претензию чужого бара по фото из интернета: у заявителя должен быть доступ к номеру, который висит на двери / в 2ГИС.

```
POST /partner/applications/{id}/phone/send     → OTP на SMS (purpose=partner_phone)
POST /partner/applications/{id}/phone/verify   { code }
```

Переиспользовать инфраструктуру OTP (`BACKEND_EMAIL_AUTH_TZ.md`): TTL 10 мин, 5 попыток, cooldown 60 с, rate limit по номеру и userId. Канал — SMS, не email.

Если SMS-провайдер на стенде не настроен → `503 PARTNER_PHONE_OTP_NOT_CONFIGURED`. Тогда админ при ревью обязан явно подтвердить звонок (`phoneVerified` выставляет ревьюер). **Нельзя** auto-approve заявку с `phoneVerified=false`.

Личный номер аккаунта и номер заведения могут совпадать (маленький бар) — это нормально.

Смена телефона после `phoneVerified` сбрасывает флаг и требует новый OTP.

### 4.5 On-site — обязательный якорь координат (I6)

Заявитель физически приходит по адресу заявки и снимает **фасад или вывеску** камерой приложения. Это не жало и не обложка места (обложку потом можно взять из галереи).

Проверки сервера — те же, что у `POST /stings`, плюс привязка к адресу:

- файл с камеры, не library (клиент шлёт `source` только как UX; сервер смотрит на отсутствие типичных gallery-маркеров и, главное, на свежий `capturedAt` ±2 мин и GPS);
- `accuracy ≤ PLACE_ONSITE_ACCURACY_MAX_M`;
- haversine(`lat/lng`, `address.lat/lng`) ≤ `PLACE_CLAIM_RADIUS_M`;
- повтор on-site перезаписывает предыдущий, пока заявка не `approved`.

Ошибки:

| code | Когда |
| --- | --- |
| `ONSITE_TOO_FAR` | дальше `PLACE_CLAIM_RADIUS_M` |
| `ONSITE_LOW_ACCURACY` | GPS хуже порога |
| `ONSITE_VALIDATION_FAILED` | анти-спуфинг как у жала |
| `ONSITE_NOT_READY` | нет адреса в заявке |

Код на бумажке / QR на экране **не** требуем на MVP: допуск по GPS+свежая камера+ревью вывески достаточны. Слабое место — сотрудник соседнего заведения в радиусе 75 м; лечится ревью фото вывески и ссылкой на 2ГИС.

После approve координаты `Place.center` = on-site, не геокод. Геокод мог поставить точку в центр здания или на дорогу; вход бара — там, где стоял партнёр. Админ может поправить центр в пределах `PLACE_CLAIM_RADIUS_M` без нового on-site. Партнёр — нет.

### 4.6 Ревью админа

UI админки на MVP нет (как у кампаний §G7): `GET` списка + `POST` решения, вызов из скрипта/Insomnia.

Чеклист ревьюера (зафиксировать в `reviewerNote` при reject/needs_info):

1. ИНН валиден, юрлицо не выглядит брошенным на глаз (ручная проверка egrul.nalog.ru — вне автоматики).
2. `brandName` и вывеска на документе/on-site совпадают с листингом 2ГИС/Яндекс.
3. Адрес листинга ≈ адрес заявки.
4. On-site фото — действительно эта вывеска, не сток и не сосед.
5. Нет live-места ближе `PLACE_OVERLAP_MIN_M`.
6. Телефон `phoneVerified`.

```
POST /admin/partner-applications/{id}/review
{ "decision": "approve" | "reject" | "needs_info", "note": "…" }
```

Побочные эффекты `approve` (атомарно):

1. `users.accountType = partner` (если ещё не partner).
2. `PartnerApplication.status = approved`, `placeId` созданного места.
3. Создаётся `Place` в `draft`: имя = `brandName`, центр = on-site, адрес с заявки, `verifiedAt = now`.
4. Награды §G5 не выдаются.

`reject` — аккаунт остаётся `personal`; повторная заявка разрешена после 7 суток (`PARTNER_REAPPLY_COOLDOWN_DAYS`). Коды отказа: `inn_mismatch`, `place_not_found`, `onsite_mismatch`, `overlap`, `spam`, `other`.

`needs_info` — заявка снова редактируема, on-site и OTP не сбрасываются, если адрес и телефон не менялись. Смена адреса сбрасывает on-site. Смена телефона — OTP.

Снять партнёрку: `POST /admin/users/{id}/account-type { personal }` + `suspended` всем live-местам. Не удалять медиа сразу — см. §11.

### 4.7 Конфликт претензий

Индекс уникальности live-мест: гео, не ИНН. Одна сеть — несколько мест.

Если новая заявка: центр ближе `PLACE_OVERLAP_MIN_M` к уже `live`/`draft` чужому месту → `409 PLACE_OVERLAP`. Ревьюер не аппрувит «второй Бар X» в той же точке. Спор «это наше заведение» — ручной тикет, перевод `ownerId` админом (`POST /admin/places/{id}/transfer`) — в MVP достаточно эндпоинта, UI нет.

Две заявки на одну точку: первая approved побеждает; вторая — `overlap`.

### 4.8 DoD §G14

Заявитель не может получить `partner` и draft-место без: валидной формы, `phoneVerified`, принятого on-site в радиусе адреса, решения админа. On-site из галереи отвергается. Координаты места после approve равны on-site, не точке, откуда заполняли анкету.

---

## G15 — Места заведений

### Задача

Дать заведению постоянное именованное присутствие на карте и карточку с фото, не подменяя улей.

### 5.1 Жизненный цикл Place

```
draft  --(cover approved)-->  live
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

Переход в `live` **только** если: owner `partner`|`official`, заявка approved (или official), есть `cover` с `moderation=approved`, статус не `suspended`. Без обложки пин не публикуем — иначе серый маркер без лица, это не «фото заведения».

Пауза — хозяин уехал в отпуск / ремонт. Suspend — нарушение. Resume из `suspended` только админ.

Удаление места: owner не удаляет навсегда из приложения (риск скрыть жалобы). `paused` достаточно. Хард-делит — админ, после истечения срока хранения §11.

### 5.2 Что партнёр редактирует сам

Можно: `name`, `description`, `category`, `socialLinks`, обложка, галерея, пауза.

Нельзя: `center`, `address`, `radiusM`, `ownerId`, `status=suspended`. Смена адреса = новая заявка (точка переехала) или тикет админу.

Лимит мест: `PLACE_MAX_PER_PARTNER`. Создание второго места — новая заявка §G14 с новым on-site, не кнопка «клонировать».

### 5.3 Публичная карточка места

Экран `app/(modals)/place/[id].tsx`:

1. Обложка (approved).
2. Имя, категория, бейдж «Партнёр».
3. Адрес, дистанция от пользователя если есть GPS.
4. Кнопка «Снять здесь» → камера; если пользователь вне `radiusM` — предупреждение «жало привяжется к месту, только если снять на точке» (сервер всё равно решит по GPS публикации).
5. Галерея места (только `moderation=approved`), горизонтальный ряд.
6. Живые гостевые фото — те же данные, что улей, если `hiveId != null`; иначе пустое состояние «Пока тихо — стань первым» + CTA камеры. Не подставлять галерею места в этот ряд.
7. Ссылка «Открыть улей», если `hiveStage === 'hive'`.
8. Пожаловаться.

Гостевые фото — `GET /places/{id}/stings` (только активные, `authorAccountType=personal` по умолчанию, партнёрские — отдельным флагом `includePartner=true`, default false). Так витрина сидинга не выглядит как очередь гостей.

### 5.4 QR и диплинк

`hiveapp://place/{id}` и `https://hive.app/p/{id}` (публичная OG-страница по образцу §G9: обложка, имя, без галереи целиком). QR партнёр скачивает/шарит из редактора места. Это основной способ зажечь улей вечером: стол → камера Hive.

Инвайт-коды §G8 не подменяем: диплинк места не обязан быть инвайтом с квотой. Атрибуцию «пришёл из места» пишем в аналитику (`place_deeplink_opened`).

---

## 6. Фото места из галереи

### 6.1 Что можно брать из библиотеки

| Медиа | Галерея | Камера приложения | Попадает на карту как жало |
| --- | --- | --- | --- |
| Обложка места | да | да | нет |
| Галерея места (до 12) | да | да | нет |
| Документы заявки | да | да | нет |
| On-site верификация | **нет** | только камера | нет |
| Живые жала партнёра и гостей | **нет** | только камера | да |

Клиент для обложки/галереи: action sheet как у аватара (`pickAvatarImage`) — «Снять» / «Выбрать из галереи». Мультивыбор галереи: `allowsMultipleSelection`, не больше оставшихся слотов. Ресайз — тот же пайплайн, что `prepareStingPhotoForUpload` (короткая сторона ≤ 1920, jpeg 0.82). EXIF GPS **не затирать** до отправки: серверу нужен для модерации. Ориентацию по-прежнему запекать.

Разрешение Photo Library запрашивать в момент выбора, не заранее. Usage string (Info.plist / Play): отдельный от аватара смысл — «чтобы загрузить фото заведения». Для обычных пользователей формулировка аватара не должна обещать загрузку мест.

### 6.2 Почему галерея безопасна только здесь

Доверие = §G14, а не метаданные кадра. Сток, чужой интерьер, рендер с сайта — остаются рисками и закрываются модерацией + жалобами (§10), не запретом галереи. Запрет галереи для витрины убьёт партнёров: нормальные кадры зала сняты на другой телефон / фотографом год назад.

### 6.3 Модерация медиа

Каждый `PlaceMedia` стартует в `pending` и **не отдаётся** в публичных `GET /places`, `places[]` nearby и OG, пока `approved`. Owner в редакторе видит pending с подписью «На проверке».

Авто-правила сервера (без ML на MVP):

| Сигнал | Действие |
| --- | --- |
| EXIF GPS есть и расстояние до `Place.center` ≤ `PLACE_RADIUS_M` × 3 | можно auto-approve, **кроме** первых 3 медиа партнёра |
| EXIF GPS есть и расстояние > 500 м | не reject, флаг `exif_far` ревьюеру |
| EXIF нет | pending, ручное |
| Первые 3 медиа каждого места | всегда ручные |
| Партнёр 14 суток с live-местом без accepted-жалоб | следующие медиа с «близким» EXIF — auto-approve |
| `image/jpeg` после конвертации, short side ≥ 800 | иначе `MEDIA_TOO_SMALL` |

Ревьюер (admin): `POST /admin/place-media/{id}/review { decision, rejectCode? }`. Reject виден owner с i18n по `rejectCode`. Cover reject не переводит live→draft сам, но если approved-cover больше нет — место автоматически `paused` с причиной `cover_missing` (пин без лица не держим).

Порядок галереи: `PATCH` массива id. Cover — отдельный слот, не «первый в галерее»: смена обложки не должна перетасовывать витрину.

Удаление: owner может удалить своё медиа. Нельзя оставить live-место без cover: удаление единственной обложки → либо сразу загрузить новую, либо место уходит в `paused`.

### 6.4 Водяные знаки, люди, сток

Отдельного детекта лиц нет (вне скоупа). Копирайт в редакторе: «Загружайте фото своего заведения. Не чужие снимки и не скриншоты». Жалоба `stolen` / `not_this_place` — очередь админу. Повторные rejects → suspend места и отзыв `partner` на усмотрение админа.

---

## 7. Связь места с ульем и картой

### 7.1 Привязка жала

При `POST /stings` сервер ищет live `Place`, в радиусе которого точка съёмки. Если несколько (не должно при `PLACE_OVERLAP_MIN_M`) — ближайший центр. Пишет `sting.placeId`.

Жало вне всех мест: `placeId=null`, поведение как сейчас.

Партнёрское жало внутри своего места тоже получает `placeId`, но:

- не увеличивает `activeGuestStingsCount`;
- не даёт вклад в `activationCount` сверх действующих правил §G13 (кап автора остаётся; в разрезе без сидинга партнёр не считается).

### 7.2 Привязка улья

Когда кластер пересчитывается (создание/истечение/удаление жала), если `hive.center` внутри live-места — `hive.placeId = place.id`, у места `hiveId` / `hiveStage` обновляются. Выход всех жал или уход центра — поля обнуляются. `hive:updated` несёт `placeId` и `place` summary, чтобы маркер сменил вид без рефетча.

Не создавать улей «из пустого места». Нет гостевых жал — нет улья, есть только пин места.

### 7.3 Слой на карте

`GET /stings/nearby` дополняется:

```json
{
  "stings": [],
  "hives": [],
  "places": [ /* PlaceSummary, только live, cover approved */ ],
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

Фильтр «Ульи» (`RN_FRONTEND_TZ.md` §9): по-прежнему только `stage=hive`. Пины тихих мест **скрыты**. Иначе фильтр «где люди» врёт витринами. Отдельный чип «Места» — вне скоупа MVP.

Обзор города §G4: места в overview **не** кластеризуем на MVP (иначе страна покроется кафе при нулевой жизни). На дальнем зуме остаются агрегаты жал.

Лимит пинов мест в одном viewport: 100; если больше — ближайшие к центру камеры, остальные отбрасываются (как страховка эха на 300).

### 7.4 Карточка улья

`HiveDetailContent`: если `place` есть — шапка с обложкой, именем, бейджем партнёра, вход в `place/[id]`. Список жал не смешивать с галереей места.

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
| POST | `/partner/applications` | Создать `draft` (1 активный draft+submitted+needs_info на пользователя) |
| GET | `/partner/applications/me` | Текущая/последние заявки пользователя |
| PATCH | `/partner/applications/{id}` | Поля формы, пока `draft` или `needs_info` |
| POST | `/partner/applications/{id}/documents` | multipart `photo` + `kind` |
| DELETE | `/partner/applications/{id}/documents/{docId}` | Пока не submitted/approved |
| POST | `/partner/applications/{id}/phone/send` | SMS OTP |
| POST | `/partner/applications/{id}/phone/verify` | `{ code }` → `phoneVerified=true` |
| POST | `/partner/applications/{id}/onsite` | multipart как sting: `photo`, `lat`, `lng`, `accuracy`, `capturedAt`; только камера |
| POST | `/partner/applications/{id}/submit` | Валидация слоёв; → `submitted` |

`submit` без on-site / без телефона / без адреса / без min документов → `422 APPLICATION_INCOMPLETE`, `details.missing: string[]`.

### 8.2 Admin заявок и мест

| Метод | Путь | Назначение |
| --- | --- | --- |
| GET | `/admin/partner-applications?status&cursor` | Очередь ревью |
| GET | `/admin/partner-applications/{id}` | Детали + signed URLs документов и on-site |
| POST | `/admin/partner-applications/{id}/review` | approve / reject / needs_info |
| POST | `/admin/places/{id}/suspend` | `{ reason }` |
| POST | `/admin/places/{id}/unsuspend` | вернуть в `paused` (owner сам включит live) |
| POST | `/admin/places/{id}/transfer` | `{ newOwnerId }` — оба должны быть partner |
| POST | `/admin/place-media/{id}/review` | approve / reject медиа |
| POST | `/admin/places` | Создать место для `official` без заявки (`center` обязателен) |

`POST /admin/users/{id}/account-type` не меняется.

### 8.3 Места

| Метод | Путь | Auth | Назначение |
| --- | --- | --- | --- |
| GET | `/places/nearby` | Bearer | Можно не делать отдельным, если `places[]` в `/stings/nearby` |
| GET | `/places/{id}` | Bearer | Публичная карточка; owner видит pending-медиа |
| GET | `/places/{id}/stings` | Bearer | Активные жала с `placeId`, cursor; `includePartner` default false |
| GET | `/places/me` | Bearer | Места owner |
| PATCH | `/places/{id}` | owner | name, description, category, socialLinks |
| POST | `/places/{id}/pause` | owner | live→paused |
| POST | `/places/{id}/resume` | owner | paused→live, если cover approved |
| POST | `/places/{id}/media` | owner | multipart `photo` + `kind=cover\|gallery` + `source=library\|camera` |
| PATCH | `/places/{id}/media/order` | owner | `{ galleryIds: UUID[] }` |
| DELETE | `/places/{id}/media/{mediaId}` | owner | см. правило cover |

`GET /stings/nearby` — добавить `places?: PlaceSummary[]`. Параметр `includePlaces` default **true**, чтобы старый клиент, который поле игнорирует, ничего не сломал, а новый мог выключить.

`GET /hives/{id}` — `hive.place` если привязан.

Публичная HTML: `GET /share/places/{id}` (не под `/api/v1`), OG: title=name, image=cover. `paused`/`suspended`/`draft` → 404.

### 8.4 Коды ошибок (новые)

`APPLICATION_INCOMPLETE`, `APPLICATION_NOT_EDITABLE`, `PARTNER_REAPPLY_COOLDOWN`, `PARTNER_PHONE_OTP_NOT_CONFIGURED`, `OTP_*` существующие, `ONSITE_TOO_FAR`, `ONSITE_LOW_ACCURACY`, `ONSITE_VALIDATION_FAILED`, `ONSITE_NOT_READY`, `PLACE_COUNTRY_UNSUPPORTED`, `PLACE_OVERLAP`, `PLACE_LIMIT`, `PLACE_NOT_LIVE`, `PLACE_SUSPENDED`, `PLACE_RESUME_NEEDS_COVER`, `MEDIA_LIMIT`, `MEDIA_TOO_SMALL`, `MEDIA_NOT_OWNER`, `COVER_REQUIRED`, `NOT_PARTNER`.

### 8.5 Rate limits

| Ресурс | Лимит |
| --- | --- |
| Создание заявок | 3 / сутки / user |
| Submit | 10 / сутки |
| Documents upload | 20 / сутки |
| Phone send | как OTP resend |
| On-site | 10 / сутки |
| Place media | 20 / сутки / user |
| Pause/resume | 10 / сутки |
| Жалоба на место | 5 / сутки / user |

### 8.6 WebSocket

Новые события не обязательны для MVP: карточка места не realtime-критична. Достаточно:

- существующий `hive:updated` с `placeId` / `place`;
- инвалидация `['places', id]` и nearby при approve обложки — через обычный refetch при фокусе.

Опционально позже: `place:updated`. Не блокирует MVP.

---

## 9. Frontend

Expo SDK 54: камера и ImagePicker — по [документации версии](https://docs.expo.dev/versions/v54.0.0/). Не писать native-модули. Галерея — расширение паттерна `src/utils/pick-avatar-image.ts`, не копипаста в каждый экран: общий `pickPlaceImage({ multiple, source })`.

### 9.1 Экраны

| Путь | Кто | Содержание |
| --- | --- | --- |
| `app/(modals)/partner/apply.tsx` | personal | Форма заявки, шаги |
| `app/(modals)/partner/documents.tsx` | заявитель | Список документов, add/delete |
| `app/(modals)/partner/phone.tsx` | заявитель | OTP, переиспользовать `OtpInput` |
| `app/(modals)/partner/onsite.tsx` | заявитель | Объяснение «придите на адрес», камера, нельзя открыть library |
| `app/(modals)/partner/status.tsx` | заявитель | submitted / needs_info / rejected |
| `app/(modals)/partner/place/edit.tsx` | partner | Имя, описание, ссылки, пауза, QR |
| `app/(modals)/partner/place/media.tsx` | partner | Обложка + галерея, статусы модерации |
| `app/(modals)/place/[id].tsx` | все | Публичная карточка |
| Профиль | все | Пункт «Для заведений» / «Мои места» по состоянию |

Навигация on-site камеры: **не** `preview.tsx` публикации жала. Иначе пользователь случайно запостит верификацию на карту. Отдельный capture-flow с явным «Это проверка адреса, фото не попадёт в ленту».

### 9.2 Карта

- `src/components/map/PlaceMarker.tsx` — обложка в скруглённом шестиугольнике без счётчика, без пульсации.
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
- App Store: обновить цель Photo Library в privacy nutrition и `privacy-policy.*` — библиотека больше не «только аватар», а «аватар и, для подтверждённых заведений, фото места». Это обязательный сопутствующий артефакт релиза G15, не «потом».

### 9.5 DoD frontend

Партнёр после approve загружает обложку из галереи; до `approved` медиа карта пустая для чужих; гость не может открыть picker галереи в камере жала; on-site flow не создаёт sting; branded улей не дублирует пин места.

---

## 10. Модерация, жалобы, антифрод

### 10.1 Жалобы

```
POST /places/{id}/reports { "reason": "not_a_place" | "wrong_location" | "stolen_photos" | "spam" | "other", "comment"? }
```

После 3 accepted (админом) жалоб за 30 дней — авто-`paused` + очередь на suspend. Порог — конфиг `PLACE_REPORT_PAUSE_THRESHOLD`.

Жалоба на конкретное медиа: `POST /places/{id}/media/{mediaId}/reports`.

### 10.2 Что система не пытается решить сама

- Обратный поиск картинок / TinEye.
- OCR вывески vs `brandName`.
- Верификация через Госуслуги / ЭЦП.

Первый год это очередь человека. Автоматика только: ИНН checksum, гео on-site, overlap, EXIF-флаг, rate limit, порог жалоб.

### 10.3 Злоупотребления и ответы

| Атака | Защита |
| --- | --- |
| Украл фото интерьера известного бара, заявка с дивана | On-site GPS обязателен; ревью вывески; телефон заведения |
| On-site у соседней двери в 50 м | Ревью фото vs 2ГИС; overlap; жалоба `wrong_location` |
| Галерея людей без согласия | Жалоба + reject `people_sensitive`; TOS |
| Партнёр льёт 12 стоков, место «живое» | Витрина не улей и не плотность; тихий пин без гостей |
| Подделка живой карты жалами из галереи | I1, без исключений для partner |
| Накрутка улья сотрудниками | §G13 кап автора; несколько аккаунтов — уже риск продукта, не решаем здесь; репорт |
| Заявка на Красную площадь | Ревью + overlap с чем угодно в центре; country RU не спасает — человек |

---

## 11. Приватность, хранение, сторы

| Данные | Где | Срок |
| --- | --- | --- |
| Документы заявки, on-site proof | private object storage | reject: 90 дней; approve: пока партнёрство + 3 года |
| Обложка/галерея | public CDN как жала, но другой prefix `places/` | пока место не hard-delete |
| ИНН, телефон, юр. имя | Mongo, доступ admin/owner | как заявка |
| EXIF GPS медиа | поля модерации, не отдавать в публичный DTO | пока медиа живо |

Публичный `Place` / `PlaceSummary` **не** содержит ИНН, legalName, телефон, документы, on-site фото, `exifGps`.

Удаление аккаунта owner (`DELETE /auth/me`): места → `suspended`, медиа снять с CDN в том же джобе, что жала; заявки анонимизировать по правилам текущей политики. Не оставлять витрину «сирот» на карте.

Обновить `legal/privacy-policy.ru.md`, `en.md`, `legal/privacy-policy.ts`:

- библиотека: аватар **и** фото заведения подтверждённого партнёра;
- отдельная категория: данные заявки партнёра (ИНН, документы, телефон точки);
- цель: верификация и карточка места;
- не смешивать с «моментами карты».

---

## 12. Аналитика и метрики

События клиента (в батч §G12, без точных координат и ИНН):

`partner_apply_started`, `partner_onsite_succeeded`, `partner_application_submitted`, `place_cover_uploaded`, `place_gallery_uploaded` (`props.source: library|camera`), `place_went_live`, `place_card_opened`, `place_deeplink_opened`, `place_report_submitted`, `place_seed_cta_tap`.

Серверные разрезы (§G12 density):

- `placesInViewport` в `session_start` (live пины, не считая те, что скрыты branded-ульем);
- `viewportDensity` **не** включает места;
- отдельная метрика `placeLiveCount` по зоне, `placeGuestStings24h`, доля мест с `hiveStage=hive`.

Решение «заведение приносит жизнь» принимается по гостевым жалам и зажжённым ульям, не по числу обложек.

---

## 13. Пошаговый план

Календарные сроки не закладываются. Порядок — чтобы не выкатить галерею на карту раньше якоря координат.

### Backend

| Шаг | Что | Зависимости | DoD |
| --- | --- | --- | --- |
| **B0** | Модели Application/Place/PlaceMedia, private+public storage prefixes, конфиг констант | — | Индексы: ownerId, 2dsphere center, status+expires не нужен |
| **B1** | CRUD заявки, документы, ИНН checksum, геокод адреса, overlap | B0 | Нельзя submit пустую |
| **B2** | Phone OTP purpose=`partner_phone` | B1, OTP-инфра | verify ставит флаг |
| **B3** | On-site multipart + анти-спуфинг + radius | B1 | Галерейный файл не проходит; далеко от адреса — `ONSITE_TOO_FAR` |
| **B4** | Admin review, атомарный approve → partner + Place draft | B2, B3 | Без on-site approve невозможен |
| **B5** | Media upload library/camera, модерация, live только с approved cover | B4 | Публичный GET без pending |
| **B6** | `placeId` на sting/hive, `places[]` в nearby, share HTML | B5 | Нет двойного рендера в контракте (поле hive.place) |
| **B7** | Reports, auto-pause, suspend/transfer, DELETE account cascade | B5 | Soft-hide |
| **B8** | OpenAPI + TECH_DOCS §3.4 Places / §3.5 Partner | B6 | Контракт совпал с этим файлом |

### Frontend

| Шаг | Что | Зависимости | DoD |
| --- | --- | --- | --- |
| **F0** | Типы, api-модули, i18n, пункт в профиле | B1 контракт | Сборка |
| **F1** | Мастер заявки + документы + OTP | B1–B2 | Сценарий до submit без on-site показывает incomplete |
| **F2** | On-site камера отдельно от sting-preview | B3 | Не создаёт жало |
| **F3** | Статус заявки, needs_info, rejected | B4 | Копирайт по rejectCode |
| **F4** | Редактор места, picker галереи/камеры, очередь загрузки | B5 | Library не открывается у non-partner |
| **F5** | Публичная карточка, диплинк, QR share | B6 | Гостевой ряд ≠ галерея |
| **F6** | Маркеры мест + branded hive/seed, фильтры | B6 | Нет дубля пин+улей; «Ульи» без тихих мест |
| **F7** | Жалоба, пауза, privacy-policy строки | B7 | Чеклист §15 |
| **F8** | Аналитика событий §12 | F5–F6 | Нет ИНН/GPS в props |

Admin UI нет. Ревью — существующий канал вызова `/admin/*`.

Параллелить можно F0–F1 с B1–B2; F4 не начинать до B5 (иначе галерея упрётся в 404).

---

## 14. Риски

- **Галерея как дыра в I1.** Любой экран, где ImagePicker стоит рядом с публикацией жала, размоет границу. On-site и place-media — отдельные модули, `POST /stings` не имеет поля `source=library`.
- **Ревью как бутылка.** Без админ-UI очередь в Insomnia не масштабируется. Для первых десятков мест приемлемо; следующий шаг после P0 — простая таблица, не полноценный кабинет.
- **SMS.** Пока провайдера нет, все заявки идут через звонок ревьюера. Нельзя «пропустить телефон».
- **Геокодер vs вход.** Адрес «ул. Тверская, 1» ставит точку не у двери. On-site как источник `center` это снимает; допуск 75 м должен покрыть кассу у входа.
- **Сети и фудкорты.** Несколько точек в одной галерее ТЦ ближе 40 м — конфликт. Админ снижает `PLACE_OVERLAP_MIN_M` точечно или правит радиусы, не партнёр.
- **Ложный улей у бара.** Сотрудники снимают с личных аккаунтов. Это уже §G13, не баг мест; в карточке места гостевой ряд честный, если `includePartner=false`.
- **App Review.** Расширение Photo Library без правки privacy nutrition — риск реджекта. Делать вместе с F7.
- **Доверие карты.** Если продуктово когда-нибудь «покажем галерею как жала» — прямой запрет I4, эскалировать как breaking change, не хотфикс.

---

## 15. Приёмочный чек-лист

- [ ] `personal` не открывает загрузку медиа места и не видит «выбрать из галереи» в камере жала
- [ ] Заявка не submit без документов, OTP телефона и on-site
- [ ] On-site дальше 75 м от геокода — `ONSITE_TOO_FAR`; файл из library on-site не принимается
- [ ] Approve без on-site невозможен; после approve `accountType=partner`, Place `draft`, center = GPS on-site
- [ ] Обложка из галереи грузится, в публичном GET и на карте появляется только после `media.approved`
- [ ] Place без approved cover не `live` и не попадает в `places[]`
- [ ] 13-й кадр галереи — `MEDIA_LIMIT`
- [ ] Гостевое жало в радиусе получает `placeId`; жало партнёра не увеличивает `activeGuestStingsCount`
- [ ] Три фото партнёра в точке места — сота/не улей по §G13, пин места branded seed, плотность без сидинга не растёт
- [ ] Два гостя зажигают улей; маркер становится branded hive, отдельный пин места исчезает
- [ ] Фильтр «Ульи» не показывает тихие места
- [ ] Истечение гостевых жал гасит улей, пин места возвращается
- [ ] Пауза owner скрывает пин; resume без cover — ошибка
- [ ] Suspend админа — 404 чужим, owner read-only
- [ ] Overlap второй заявки в 20 м — `PLACE_OVERLAP`
- [ ] Диплинк/QR открывает карточку; OG содержит обложку и имя
- [ ] Жалоба работает; документы заявки не отдаются публично
- [ ] `DELETE /auth/me` owner убирает место с карты
- [ ] Privacy policy и store disclosures упоминают галерею для мест
- [ ] `npm run lint` / `npx tsc --noEmit` после клиентской реализации; OpenAPI синхронизирован

---

## 16. Вне скоупа

- Кабинет сотрудника / несколько ролей на одно место
- Self-serve кампании и «час улья» партнёром (остаётся admin §G7)
- Чип фильтра «Места», поиск заведений, категории на карте как в 2ГИС
- Меню, столы, бронь, оплата, отзывы-звёзды
- Авто-верификация ЕГРЮЛ, Госуслуги, претензия Google/Yandex Business
- Импорт фото из Instagram / сайта (это уже не галерея устройства)
- Видео и живые сторис места
- Места вне RU
- Смена адреса места партнёром без новой заявки
- Показ медиа места в эхе, overview страны, ленте «Рядом» как карточек жала
- Ослабление I1 для партнёрских жал («пусть зальют вечер из галереи на карту»)
- Админ-UI (эндпоинты есть, интерфейс — отдельная задача)
- Награды за «первое место в зоне» и монетизация партнёров (подписка, промопин)

Монетизация и меню имеют смысл только после того, как live-место + гостевой улей работают честно.
