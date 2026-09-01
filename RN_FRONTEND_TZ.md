# Sting App — ТЗ на разработку frontend (React Native)

Версия: 0.2
Стек backend: Node.js + Express + MongoDB + Socket.io, контракты — `openapi.yaml` / `TECH_DOCS.md`  
Backend-ТЗ по email OTP и сбросу пароля: **`BACKEND_EMAIL_AUTH_TZ.md`** (реализуется отдельно от этого документа).

---

## Содержание

1. [Технологический стек frontend](#1-технологический-стек-frontend)
2. [Структура проекта](#2-структура-проекта)
3. [Пошаговый план разработки](#3-пошаговый-план-разработки)
4. [Требования к интеграции с API](#4-требования-к-интеграции-с-api)
5. [Нефункциональные требования](#5-нефункциональные-требования)
6. [Чек-лист готовности к сборке](#6-чек-лист-готовности-к-сборке)
7. [Идентификация по email (OTP) и восстановление пароля](#7-идентификация-по-email-otp-и-восстановление-пароля)

---

## 1. Технологический стек frontend

| Слой                 | Технология                             | Причина                                                                    |
| -------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Фреймворк            | React Native + Expo (managed workflow) | Быстрый старт, не нужен нативный Xcode/Android Studio код на старте        |
| Навигация            | Expo Router (file-based)               | Структура `app/` уже согласована — см. раздел 2                            |
| Язык                 | TypeScript                             | Типы можно синхронизировать с backend через `openapi.yaml`                 |
| Стили                | NativeWind (Tailwind для RN)           | Быстрая стилизация без отдельных StyleSheet-файлов на каждый компонент     |
| Серверное состояние  | React Query (`@tanstack/react-query`)  | Кэш, инвалидация, повторные запросы — не писать вручную                    |
| Клиентское состояние | Zustand                                | Только для auth и эфемерного UI-состояния (см. `TECH_DOCS.md`, раздел 1.5) |
| HTTP-клиент          | Axios                                  | Интерцепторы для токена и refresh-flow                                     |
| Realtime             | `socket.io-client`                     | Backend уже на Socket.io — версии протокола должны совпадать               |
| Камера               | `expo-camera`                          | Официальный Expo-модуль, не требует prebuild на старте                     |
| Геолокация           | `expo-location`                        | Аналогично                                                                 |
| Хранение токенов     | `expo-secure-store`                    | `accessToken`/`refreshToken` не должны лежать в открытом AsyncStorage      |
| Карта                | `react-native-maps`                    | Google/Apple Maps под капотом                                              |

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
│   │   ├── auth.ts               # + otp/verify, otp/resend, password/forgot|reset
│   │   ├── stings.ts
│   │   ├── hives.ts
│   │   └── websocket.ts
│   ├── components/
│   │   ├── auth/                 # AuthInput, OtpInput, AuthButton, …
│   │   ├── map/
│   │   ├── camera/
│   │   ├── ui/
│   │   └── feed/
│   ├── hooks/
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
- `src/api/auth.ts` — `/auth/register`, `/auth/login`, `/auth/otp/verify`, `/auth/otp/resend`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/refresh`, `/auth/logout`, `/auth/me`.
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

### Этап 2 — Карта и геолокация (без публикации)

**Задачи:**

- `src/hooks/useLocation.ts` — запрос разрешения, текущие координаты, точность.
- `src/components/map/MapContainer.tsx` — обёртка над `react-native-maps`, центрирование на пользователе.
- `src/hooks/useStingsNearby.ts` — React Query поверх `GET /stings/nearby`, с debounce на изменение региона карты (300мс — см. `TECH_DOCS.md`).
- `src/components/map/StingMarker.tsx` — рендер одиночных точек (без визуальной логики угасания пока — просто точка).
- `src/stores/mapStore.ts` — `region`, `selectedStingId`, `selectedHiveId`.

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

**Definition of Done:** приложение собирается через `eas build` без ошибок, полный пользовательский флоу (онбординг → регистрация → OTP → карта → съёмка → просмотр улья → выход; отдельно — forgot/reset пароля) проходится вручную без сбоев на реальном устройстве.

---

## 4. Требования к интеграции с API

- **Базовый URL** — берётся из `app.config.ts`/env, не хардкодится в `client.ts`.
- **Формат ошибок** — все ответы 4xx/5xx приходят как `{ error: { code, message, details } }` (см. `openapi.yaml`, `ErrorResponse`). Frontend обязан читать `error.code` для логики (например, показать разные экраны для `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `OTP_EXPIRED`, `RATE_LIMITED`), а `error.message` использовать только как fallback-текст, не как основной источник UX-копирайта.
- **Auth без токена** — `register`, `login`, `otp/*`, `password/forgot`, `password/reset`, `refresh` вызываются с `skipAuthRefresh: true`.
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

---

## 6. Чек-лист готовности к сборке

- [ ] Все этапы 0–8 пройдены и вручную проверены на реальном устройстве
- [ ] Флоу раздела 7 (register OTP + forgot/reset) пройден на staging с реальной почтой
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

| Шаг | Экран | Действие пользователя | API | Успех |
| --- | ----- | --------------------- | --- | ----- |
| A1 | `register` | username, email, password → «Зарегистрироваться» | `POST /auth/register` | Сохранить `pendingEmail`, `otpPurpose=register`; **не** писать токены; `router.push` на `verify-otp` |
| A2 | `verify-otp` | Ввод 6 цифр | `POST /auth/otp/verify` `{ email, code, purpose: "register" }` | Сохранить `user` + tokens → `status=authenticated` → `/(tabs)` |
| A3 | `verify-otp` | «Отправить код снова» (после cooldown) | `POST /auth/otp/resend` | Сброс полей ввода, новый countdown |

Клиентская валидация на A1: непустые поля; email-формат; password ≥ 8 символов.

#### Сценарий B — Login при ещё не подтверждённом email

```
login → 403 EMAIL_NOT_VERIFIED → verify-otp → (tabs)
```

| Шаг | Действие | Поведение |
| --- | -------- | --------- |
| B1 | Верные credentials, email не verified | Показать OTP; `pendingEmail` из `error.details.email`; опционально сразу `otp/resend` |
| B2 | Успешный verify | Как A2 |

#### Сценарий C — Обычный login

```
login → (tabs)
```

`POST /auth/login` → сессия. Ошибка `INVALID_CREDENTIALS` — сообщение на форме.

#### Сценарий D — Восстановление пароля

```
login → forgot-password → reset-password → (tabs) или login
```

| Шаг | Экран | Действие | API | Успех |
| --- | ----- | -------- | --- | ----- |
| D1 | `login` | Тап «Забыли пароль?» | — | `forgot-password` |
| D2 | `forgot-password` | Email → «Отправить код» | `POST /auth/password/forgot` | Всегда успех UX (anti-enumeration); → `reset-password` с email |
| D3 | `reset-password` | 6 цифр + newPassword (+ confirm) | `POST /auth/password/reset` | Если backend вернул tokens — сразу `(tabs)`; если 204 — `login` с тостом «Пароль обновлён» |
| D4 | Resend | Как A3, `purpose=password_reset` | `POST /auth/otp/resend` | Новый countdown |

### 7.3. Экраны и UI-требования

| Экран | Ключевые элементы |
| ----- | ----------------- |
| `register` | username, email, password; ссылка на login; после submit — только переход на OTP, без «тихого» входа |
| `login` | email, password; «Забыли пароль?»; ссылка на register; обработка `EMAIL_NOT_VERIFIED` |
| `verify-otp` | маскированный email; `OtpInput` на 6 ячеек; таймер TTL (опционально); «Отправить снова» + countdown cooldown; назад на register/login |
| `forgot-password` | email; CTA отправки кода; назад на login |
| `reset-password` | OtpInput; newPassword; confirmPassword; resend |

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

| Поле / action | Назначение |
| ------------- | ---------- |
| `pendingEmail: string \| null` | Email ожидающего OTP |
| `otpPurpose: 'register' \| 'password_reset' \| null` | Контекст OTP-экрана |
| `register()` | Вызов API register → выставить pending*, **без** tokens |
| `verifyOtp({ email, code, purpose })` | При успехе — как текущий login (tokens + user + SecureStore) |
| `resendOtp({ email, purpose })` | Обёртка resend |
| `forgotPassword({ email })` | Запрос кода сброса |
| `resetPassword({ email, code, newPassword })` | Сброс; при tokens — установить сессию |
| `clearPendingOtp()` | Очистка pending при уходе с флоу |

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

| Шаг | Задачи | DoD |
| --- | ------ | --- |
| **F0** | Согласовать финальный контракт с `BACKEND_EMAIL_AUTH_TZ.md`; обновить типы | Типы компилируются; расхождений с backend-доком нет |
| **F1** | `auth.ts`: новые методы; i18n-ключи ошибок OTP | Вызовы работают против staging/mock |
| **F2** | `OtpInput` + экран `verify-otp` (UI + локальный state, без полного store) | Можно ввести/вставить 6 цифр, виден email и resend-кнопка |
| **F3** | Переключить `register`: убрать мгновенный `replace('/(tabs)')`; store `pending*`; навигация на OTP; `verifyOtp` → сессия | Сценарий A end-to-end |
| **F4** | Login: обработка `EMAIL_NOT_VERIFIED` → OTP (сценарий B) | Неconfirmed user доходит до tabs только после кода |
| **F5** | `forgot-password` + `reset-password` + ссылка с login (сценарий D) | Сброс пароля работает; старый пароль на login не проходит |
| **F6** | Cooldown resend (`resendAvailableInSec` / `details.retryAfterSec`); UX `OTP_EXPIRED` / `OTP_MAX_ATTEMPTS` (предложить resend) | Кнопка resend блокируется; ошибки понятны |
| **F7** | Ручной регресс: A–D + перезапуск приложения после verify | Чек-лист §7.7 закрыт |

### 7.6. Маппинг ошибок → UX

| `error.code` | UX |
| ------------ | --- |
| `VALIDATION_ERROR` | Подсветка полей / «Проверьте данные» |
| `USER_ALREADY_EXISTS` | На register: «Аккаунт уже есть» + ссылка на login |
| `INVALID_CREDENTIALS` | На login: «Неверный email или пароль» |
| `EMAIL_NOT_VERIFIED` | Редирект/навигация на `verify-otp` |
| `OTP_INVALID` | «Неверный код» |
| `OTP_EXPIRED` | «Код истёк» + акцент на resend |
| `OTP_MAX_ATTEMPTS` | «Слишком много попыток» + resend нового кода |
| `OTP_RESEND_COOLDOWN` | Заблокировать кнопку; взять `details.retryAfterSec` |
| `OTP_RATE_LIMITED` | «Подождите и попробуйте позже» |
| `EMAIL_SEND_FAILED` | «Не удалось отправить письмо, повторите» |

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
