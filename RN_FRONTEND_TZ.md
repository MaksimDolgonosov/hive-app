# Sting App — ТЗ на разработку frontend (React Native)

Версия: 0.3
Стек backend: Node.js + Express + MongoDB + Socket.io, контракты — `openapi.yaml` / `TECH_DOCS.md`  
Backend-ТЗ по email OTP и сбросу пароля: **`BACKEND_EMAIL_AUTH_TZ.md`** (реализуется отдельно от этого документа).  
Вход через Google: контракт **`POST /auth/google`** уже есть на backend (`hive-backend-nodejs`); frontend-ТЗ — **[раздел 8](#8-вход-через-google)**.  
Механики привлечения пользователей и борьбы с пустой картой (cold start): **`RN_GROWTH_TZ.md`** (клиент) и **`BACKEND_GROWTH_TZ.md`** (сервер, источник истины по контрактам).

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
| Карта                | `react-native-maps`                    | Google/Apple Maps под капотом                                                            |

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
- `src/components/map/MapContainer.tsx` — обёртка над `react-native-maps`, центрирование на пользователе.
- `src/hooks/useStingsNearby.ts` — React Query поверх `GET /stings/nearby`, с debounce на изменение региона карты (300мс — см. `TECH_DOCS.md`).
- `src/components/map/StingMarker.tsx` — рендер одиночных точек (без визуальной логики угасания пока — просто точка).
- `src/stores/mapStore.ts` — `region`, `selectedStingId`, `selectedHiveId`.

Фильтры маркеров («Всё / Свежее / Ульи / Скоро исчезнет») в этот этап **не входят** — отдельное ТЗ в [разделе 9](#9-фильтры-маркеров-на-карте).

**Зависимости:** Этап 1 (нужен `accessToken` для запросов).

**Definition of Done:** карта открывается, запрашивает разрешение на геолокацию, центрируется на пользователе, при перемещении карты подгружает жала из `GET /stings/nearby` и отображает точками (тестово — можно вручную создать несколько `Sting` через Postman/curl на backend, чтобы было что показывать).

**Риски:** `react-native-maps` требует нативной сборки для полной функциональности на некоторых платформах — на этом этапе стоит сразу проверить, что Expo Go достаточно, или нужен `expo prebuild`/dev build.

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
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`     | то же                             | iOS OAuth client, bundle `com.hive.app`                         |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | то же                             | Android OAuth client, package `com.hive.app` + SHA-1            |

Проброс уже есть в `app.config.ts` / `src/config/env.ts`. Значения **не** коммитить. Для EAS — secrets / `eas.json` env, не хардкод в git.

На backend: `GOOGLE_CLIENT_IDS` (через запятую) **включает те же** Web, iOS и Android Client ID.

#### Google Cloud Console (чеклист, не код)

1. OAuth consent screen (External / Testing + test users на этапе разработки).
2. **Web application** Client ID — для мобилки Authorized redirect URIs / JS origins можно оставить пустыми: Google Web-тип **не принимает** `exp://` и `hiveapp://`.
3. **iOS** Client ID: bundle id `com.hive.app`.
4. **Android** Client ID: package `com.hive.app` + SHA-1 **того keystore, которым подписана установленная сборка** (debug / EAS development ≠ Play upload key).

Scheme приложения: `hiveapp` (`app.config.ts`).

#### Почему не Expo Go

| Причина                                                           | Следствие                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Bundle / package Expo Go — `host.exp.Exponent`, не `com.hive.app` | iOS/Android OAuth clients Hive не совпадут                                             |
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

SDK: Expo 54, `expo-auth-session` (Google provider). Перед правками сверять [доку Expo SDK 54 AuthSession](https://docs.expo.dev/versions/v54.0.0/sdk/auth-session/). Хелперы Google в AuthSession помечены deprecated в пользу native SDK — **остаёмся на auth-session**, пока флоу стабилен на dev build; миграция — §8.11.

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

| Значение   | Подпись        | Что показывает на карте                       | Источник данных                             |
| ---------- | -------------- | --------------------------------------------- | ------------------------------------------- |
| `all`      | Всё            | Все жала + все активные ульи                  | ответ `/stings/nearby` без изменений        |
| `fresh`    | Свежее         | Только «молодые» жала (§9.2), ульи скрыты     | `Sting.createdAt`, `Sting.expiresAt`        |
| `hives`    | Ульи           | Только активные ульи, одиночные жала скрыты   | `hives[].activeStingsCount`, `isActiveHive` |
| `expiring` | Скоро исчезнет | Только жала на исходе TTL (§9.2), ульи скрыты | `Sting.createdAt`, `Sting.expiresAt`        |

`fresh` и `expiring` — про **отдельные жала**, поэтому ульи под ними скрываются: TTL фото внутри улья клиенту неизвестен без `GET /hives/:id`, и подмешивать улей в выборку по времени было бы ложью. Порог активности улья остаётся общим — `HIVE_ACTIVATION_THRESHOLD` из `src/utils/hive.ts`, отдельной логики для фильтра не вводить.

### 9.2. Пороги «свежести» и «истечения» — только относительные

Абсолютные пороги («опубликовано меньше 30 минут назад») использовать **нельзя**: по `RN_GROWTH_TZ.md` §G1 сервер выдаёт TTL от 4 до 72 часов в зависимости от плотности зоны, и одно и то же «осталось 30 минут» означает разное для жала на 4 часа и на 72.

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
- **Пустой результат из-за фильтра ≠ пустой район.** Текущий `isEmpty` в `MapContainer` показывает `map.emptyTitle` («рядом никого»). При активном фильтре, когда до фильтрации данные были непустыми, показывать отдельный баннер `map.filter.emptyTitle` с действием «Показать всё», сбрасывающим фильтр на `all`. Смешивать эти два состояния нельзя — это прямо противоречит правилу копирайта из `RN_GROWTH_TZ.md` §G1 (пустая карта формулируется как возможность, а не как отсутствие контента).
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
- [ ] `Ульи` — только ульи с `activeStingsCount >= HIVE_ACTIVATION_THRESHOLD`, одиночных пинов нет
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
