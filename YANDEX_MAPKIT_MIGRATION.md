# План миграции: `react-native-maps` → Yandex MapKit

Оценка: **5–8 рабочих дней** (1 dev), если делать после завершения текущего MVP (WebSocket, «Рядом»).

Рекомендуемая библиотека: [`expo-yandex-mapkit`](https://github.com/softwhere-uz/expo-yandex-mapkit) (Expo Modules, New Architecture).

---

## 0. Предусловия (до кода)

| Шаг | Действие |
|-----|----------|
| 1 | Зарегистрироваться в [кабинете Яндекс API](https://yandex.ru/dev/maps/) → подключить **MapKit – mobile SDK** |
| 2 | Получить API-ключ, дождаться активации (~15 мин) |
| 3 | Прочитать [условия бесплатного использования](https://yandex.ru/maps-api/tariffs) и оценить DAU |
| 4 | Выбрать flavor: **`lite`** (достаточно для Hive: карта + маркеры + круги) или **`full`** (если позже нужен поиск/маршруты) |

**Важно:** `expo-yandex-mapkit` ориентирован на **Expo SDK 55+**. Сейчас в проекте **SDK 54** — миграцию карт лучше совместить с апгрейдом Expo или временно использовать `react-native-yamap-plus` (больше возни с конфигом).

---

## 1. Этап инфраструктуры (1–1.5 дня)

### 1.1 Апгрейд Expo (если идём через `expo-yandex-mapkit`)

```bash
npx expo install expo@^55 --fix
npx expo install expo-yandex-mapkit
```

### 1.2 Конфиг `app.config.ts`

```typescript
plugins: [
  // ...существующие
  [
    'expo-yandex-mapkit',
    {
      apiKey: process.env.YANDEX_MAPKIT_API_KEY,
      flavor: 'lite', // для Hive достаточно
      locale: 'ru_RU',
    },
  ],
],
```

### 1.3 Env

```env
# .env / EAS secrets
YANDEX_MAPKIT_API_KEY=ваш_ключ
```

### 1.4 Сборка

- Expo Go **не подойдёт** — только **dev build** / EAS
- Пересборка iOS + Android после добавления плагина
- Проверить: `GlassTabBar` + карта на Android (уже был конфликт BlurView + MapView)

### 1.5 Удаление старого

После успешного POC:

```bash
npm uninstall react-native-maps
```

---

## 2. Карта соответствий API

| Сейчас (`react-native-maps`) | Yandex MapKit (`expo-yandex-mapkit`) |
|---|---|
| `<MapView>` | `<YandexMap>` / `<MapView>` (смотреть API пакета) |
| `initialRegion` | `cameraPosition={{ point, zoom }}` |
| `onRegionChangeComplete` | `onCameraPositionChange` / `onCameraPositionChangedEnd` |
| `animateToRegion(region, ms)` | `setCenter` / `fitMarkers` / анимированная `cameraPosition` |
| `showsUserLocation` | `showUserLocation` + разрешения (`expo-location`) |
| `<Marker coordinate>` | `<Marker point>` + `onPress` |
| `<Circle center radius>` | `<Circle>` / polygon overlay (проверить в lite) |
| `Region { lat, lng, latDelta, lngDelta }` | `{ point: { lat, lon }, zoom }` |
| `regionToBounds()` | `getVisibleRegion()` **или** оставить свою математику через zoom→delta |

### Критичный момент: bbox для API

Сейчас bbox считается из `MapRegion` в `src/utils/map.ts`:

```typescript
export function regionToBounds(region: MapRegion): MapBounds {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;

  return {
    swLat: region.latitude - halfLat,
    swLng: region.longitude - halfLng,
    neLat: region.latitude + halfLat,
    neLng: region.longitude + halfLng,
  };
}
```

**Задача миграции:** либо

- добавить `zoomToBounds(center, zoom, screenSize)` в `src/utils/map.ts`,

либо

- использовать `mapRef.getVisibleRegion()` из Yandex SDK и напрямую получать `swLat/neLat/...`.

`useStingsNearby`, `useMapWebSocket`, `nearby.tsx` **не трогаем** — они работают с `MapBounds`, меняется только источник bounds.

---

## 3. Файлы и объём работ

### Фаза A — POC (1 день)

**Цель:** одна карта, центр на Москве, пользователь, один маркер.

| Файл | Действие |
|------|----------|
| `src/components/map/YandexMapView.tsx` | **новый** — тонкая обёртка над SDK |
| `app/(tabs)/index.tsx` | временно подключить POC вместо `MapContainer` |

**Критерий:** dev build на iOS/Android, карта рендерится, зум/пан работают.

---

### Фаза B — `MapContainer` (1.5–2 дня)

| Файл | Изменения |
|------|-----------|
| `src/components/map/MapContainer.tsx` | заменить `MapView` → Yandex; ref API; camera вместо region |
| `src/utils/map.ts` | добавить `cameraToRegion`, `regionToCamera`, `cameraToBounds` |
| `src/stores/mapStore.ts` | опционально: хранить `MapRegion` как сейчас (абстракция) или перейти на `CameraPosition` |

**Сохранить без изменений логику:**

- debounce 300 ms → `useStingsNearby`
- `pendingMapFocus` после публикации
- `centerOnUserLocation`
- overlay loading/error + `MapLocationButton`
- `HiveBottomSheet`

---

### Фаза C — Маркеры и ульи (1–1.5 дня)

| Файл | Изменения |
|------|-----------|
| `src/components/map/StingMarker.tsx` | Yandex `Marker` вместо `react-native-maps` |
| `src/components/map/HiveCircle.tsx` | `Circle` (радиус `hive.radiusM`) + центральный маркер с числом |

**Риск:** кастомный React-маркер (View + Text для счётчика) — проверить производительность при 50+ объектах.

**Fallback:** PNG-иконки через `Image` внутри маркера или нативные pin-иконки.

**HiveCircle сейчас** (`src/components/map/HiveCircle.tsx`):

- полупрозрачный `Circle` радиусом `hive.radiusM`
- центральный `Marker` с badge `activeStingsCount`

Нужно 1:1 повторить на Yandex API.

---

### Фаза D — Интеграция с остальным приложением (0.5 дня)

| Файл | Затронут? |
|------|-----------|
| `src/hooks/useMapWebSocket.ts` | нет (bounds те же) |
| `src/hooks/useStingsNearby.ts` | нет |
| `app/(tabs)/nearby.tsx` | нет (читает `mapStore.region`) |
| `src/hooks/useCamera.ts` | нет (fallback coords из `mapRegion`) |
| `src/components/ui/GlassTabBar.tsx` | проверить Android overlay |

---

### Фаза E — Документация и cleanup (0.5 дня)

| Файл | Действие |
|------|----------|
| `RN_FRONTEND_TZ.md` | обновить стек карт |
| `TECH_DOCS.md` | описать Yandex MapKit, env, dev build |
| `.env.example` | `YANDEX_MAPKIT_API_KEY` |
| `package.json` | убрать `react-native-maps` |

---

## 4. Архитектура (рекомендация)

Чтобы не размазывать Yandex API по проекту:

```
src/components/map/
  MapContainer.tsx        ← UI + orchestration (как сейчас)
  StingMarker.tsx
  HiveCircle.tsx
  adapters/
    map-camera.ts         ← region ↔ camera ↔ bounds
    yandex-map-ref.ts     ← тип ref, animateToRegion-совместимый API
```

`MapContainer` вызывает `animateToRegion(userRegion, 500)` через адаптер — внутренности Yandex скрыты.

---

## 5. Чеклист тестирования

### Функциональность

- [ ] Первый запуск: карта центрируется на пользователе
- [ ] Pan/zoom → через 300 ms уходит запрос `GET /stings/nearby`
- [ ] Жала отображаются как точки
- [ ] 3+ жала → улей (круг + badge с числом)
- [ ] Тап по жалу → modal `sting/[id]`
- [ ] Тап по uлью → `HiveBottomSheet`
- [ ] После публикации → фокус на новое жало
- [ ] Кнопка «Моё местоположение»
- [ ] WebSocket: новое жало появляется без рефетча
- [ ] Вкладка «Рядом» получает те же bounds

### Платформы

- [ ] iOS dev build (liquid glass tab bar + карта)
- [ ] Android dev build (без белого экрана карты)
- [ ] Отказ в геолокации — экран с кнопкой в Settings

### Производительность

- [ ] 30+ маркеров — плавный скролл карты
- [ ] Нет мерцания маркеров при аналоге `tracksViewChanges: false`

---

## 6. Риски и mitigations

| Риск | Вероятность | Mitigation |
|------|-------------|------------|
| Expo SDK 54 ↔ yandex-mapkit несовместимы | высокая | апгрейд до SDK 55+ в отдельной ветке |
| Android: карта + glass tab bar | средняя | тест на Phase A; fallback непрозрачный tab bar |
| `getVisibleRegion` расходится с `regionToBounds` | средняя | unit-тесты для `cameraToBounds` |
| Кастомные маркеры тормозят | средняя | статичные иконки, отключить лишние re-render |
| Рост DAU → платный тариф | низкая (на старте) | мониторинг DAU в кабинете Яндекса |
| Community-библиотека устареет | средняя | тонкий adapter-слой, форк при необходимости |

---

## 7. Порядок в roadmap Hive

```
Сейчас (MVP)          →  MapKit (отдельный этап)
─────────────────────────────────────────────
Этап 5 WebSocket      Фаза 0: ключ + SDK upgrade
Этап 6 Nearby         Фаза A: POC
                      Фаза B–E: полная миграция
```

**Не смешивать** с WebSocket-этапом — иначе сложно понять, кто сломал realtime.

---

## 8. Definition of Done

1. `react-native-maps` удалён из зависимостей
2. Карта работает в dev build iOS + Android
3. Все сценарии из чеклиста пройдены
4. `YANDEX_MAPKIT_API_KEY` в EAS secrets, не в git
5. `TECH_DOCS.md` обновлён
6. В production-сборке отображается атрибуция Яндекса (если требует лицензия)

---

## 9. Быстрый старт (первая ветка)

```bash
git checkout -b feat/yandex-mapkit-poc

# после SDK upgrade
npx expo install expo-yandex-mapkit
# добавить plugin в app.config.ts
eas build --profile development --platform ios
```

POC-компонент ~80 строк: карта + `showUserLocation` + один `<Marker>` на `DEFAULT_MAP_REGION`.

---

## 10. Плюсы и минусы (кратко)

### Плюсы

- Лучшие карты в РФ/СНГ (актуальные данные, POI, дороги)
- Привычный UX для русскоязычной аудитории
- Запас на будущее: поиск, маршруты, пробки (flavor `full`)
- Бесплатный старт при выполнении условий тарифа MapKit SDK (DAU)

### Минусы

- Нет официального React Native SDK — community-обёртки
- Существенная миграция (`MapContainer`, маркеры, круги, bounds)
- Expo Go не работает — только dev build
- Возможен апгрейд Expo SDK 54 → 55+
- Слабее за пределами РФ/СНГ
- Платная лицензия при росте DAU
- Для текущего MVP карта — фон для жал; `react-native-maps` уже закрывает задачу

### Рекомендация

Оставить `react-native-maps` до завершения MVP. Переходить на Yandex, если продукт точно для РФ/СНГ и пользователи жалуются на качество подложки карты.

---

## Ссылки

- [Yandex MapKit — документация](https://yandex.ru/maps-api/docs/mapkit/index.html)
- [Тарифы MapKit SDK](https://yandex.ru/maps-api/tariffs)
- [expo-yandex-mapkit (GitHub)](https://github.com/softwhere-uz/expo-yandex-mapkit)
- [react-native-yamap-plus (альтернатива)](https://github.com/Qudaeo/react-native-yamap-plus)
