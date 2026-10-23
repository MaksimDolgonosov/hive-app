# План миграции: `react-native-maps` → Yandex MapKit

Сверка с репозиторием: **16 октября 2026**. Клиент переведён на `expo-yandex-mapkit` (flavor `lite`, MapKit 4.42.0). Expo Go карту не откроет: нужен новый dev build, чтобы `YANDEX_MAPKIT_API_KEY` попал в нативный проект. Ниже — как миграция устроена и что проверить на устройстве.

Оценка: **8–12 рабочих дней** (1 dev). Раньше здесь было 5–8 дней под карту из `MapContainer` + жало + улей. Сейчас на карте ещё обзор города, эхо, места, семена ульев, тип подложки и отдельная карта точки заведения.

Библиотека: [`expo-yandex-mapkit@2.23.0`](https://github.com/softwhere-uz/expo-yandex-mapkit) (Expo Modules, New Architecture, MIT). Peer dependencies: `expo >= 55`, `react >= 19.2`, `react-native >= 0.83`. CI гоняется на SDK 57 / RN 0.86; пол заявлен с SDK 55. Нативный MapKit по умолчанию **4.42.0**.

Альтернатива `react-native-yamap-plus` для обхода SDK 54 больше не нужна.

---

## Сейчас в Hive

| | Факт |
|---|---|
| Expo | `expo ^55`, React `19.2.0`, React Native `0.83.10` |
| Карты | `expo-yandex-mapkit`, плагин в `app.config.ts`, flavor `lite`, MapKit `4.42.0` |
| Ключ | `YANDEX_MAPKIT_API_KEY` в `.env` / EAS. В JS только флаг `extra.yandexMapKitConfigured` |
| Геолокация | плагин `expo-location` уже пишет `NSLocationWhenInUseUsageDescription` |
| Регион | `MapRegion` в `mapStore`; bounds считаются в `regionToBounds` (`src/utils/map.ts`) |
| Платформы | `app.config.ts` → `platforms: ['ios', 'android']`. Веб-карта не нужна |

`EXPO_SDK_55_MIGRATION.md` описывает состояние до апгрейда. Апгрейд в `package.json` уже сделан, MapKit в тот этап не входил.

---

## 0. Предусловия (до кода)

| Шаг | Действие |
|-----|----------|
| 1 | Кабинет [Яндекс API](https://yandex.ru/dev/maps/) → ключ **MapKit Mobile SDK** на bundle id `site.hiveapp.app` (iOS и Android) |
| 2 | Дождаться активации ключа |
| 3 | Сверить [условия MapKit](https://yandex.ru/maps-api/tariffs) с ожидаемым DAU. Цифры тарифа в README библиотеки намеренно не зафиксированы — они меняются |
| 4 | Flavor **`lite`**. Для Hive хватает карты, маркеров, кругов, кластеризации и точки пользователя. **`full`** нужен только для поиска, саджеста, геокодера и маршрутов MapKit — своего поиска по карте в клиенте нет |
| 5 | Решить спутник отдельно: `mapType: 'satellite' \| 'hybrid'` на бесплатном ключе MapKit Mobile SDK **не грузит тайлы**, остаётся пустая сетка. Доступ к съёмке включается в кабинете на ключ |

Отдельный апгрейд Expo для этой миграции не нужен.

---

## 1. Этап инфраструктуры (1–1.5 дня)

### 1.1 Установка

```bash
npx expo install expo-yandex-mapkit
```

Пин версии нативного SDK задаётся плагином, не пакетом npm. Для воспроизводимых сборок указать `version: '4.42.0'` явно (это дефолт 2.23.0).

### 1.2 Конфиг `app.config.ts`

Плагин `react-native-maps` убрать после рабочего POC, не до него.

```typescript
plugins: [
  // ...существующие, включая expo-location
  [
    'expo-yandex-mapkit',
    {
      apiKey: process.env.YANDEX_MAPKIT_API_KEY,
      flavor: 'lite',
      version: '4.42.0',
    },
  ],
],
```

`locale` не хардкодить в `ru_RU`: в приложении есть i18n. Без `locale` карта следует языку устройства. Смена языка в рантайме через `setLocale` на iOS действует только до создания первой карты, на Android — после перезапуска.

`locationWhenInUsePermission` в плагин MapKit **не передавать**. Текст разрешения уже задаёт `expo-location`; повтор перезапишет `NSLocationWhenInUseUsageDescription`.

Плагин сам поднимает Android `minSdk` до **26** и iOS deployment target до **16.4**, если в шаблоне ниже. Уже более высокие значения не понижает.

Ключ на сборке пишется в `AndroidManifest.xml` и `Info.plist`, MapKit инициализируется при старте. Вызов `initialize()` не нужен. Это клиентский ключ, как текущий Google Maps key: в git его не класть, в `app.config.ts` читать из `process.env`.

### 1.3 Env

```env
# .env / EAS secrets
YANDEX_MAPKIT_API_KEY=
```

`GOOGLE_MAPS_API_KEY` удалить из `.env.example`, EAS и `extra` вместе с плагином `react-native-maps`.

### 1.4 Сборка

- Expo Go не запускает модуль. Нужен dev build: `npx expo run:ios` / `run:android` или EAS `development`
- После плагина — полный prebuild, не hot reload
- Симулятор iOS иногда рисует чёрную карту. Пустой экран сначала проверять на устройстве
- `GlassTabBar` поверх карты: задать `mapPadding.bottom` и `logoPadding`, чтобы логотип Яндекса не уехал под таб-бар

### 1.5 Удаление старого

После POC на обеих платформах:

```bash
npm uninstall react-native-maps
```

И убрать плагин `react-native-maps`, `isGoogleMapsConfigured()` и `HIVE_*_MAP_STYLE`, если тёмная тема уедет на `nightMode`.

---

## 2. Карта соответствий API

Имена ниже — из README `expo-yandex-mapkit` 2.23.0. Компонент один: `YandexMapView`.

| Сейчас (`react-native-maps`) | Yandex MapKit |
|---|---|
| `<MapView>` | `<YandexMapView>` |
| `initialRegion` / `animateToRegion(region, ms)` | `cameraPosition={{ latitude, longitude, zoom }}` или `setCenter(position, { durationSeconds })`. 500 мс → `durationSeconds: 0.5` |
| `onRegionChange` / `onRegionChangeComplete` | `onCameraPositionChanged` (`reason`, `finished`) **или** алиас `onRegionChangeComplete` с `{ latitude, longitude, latitudeDelta, longitudeDelta }` |
| `showsUserLocation` | `showUserPosition`. Разрешение уже запрашивает `expo-location` |
| `mapType` `standard` / `hybrid` | `map` или `vector` / `satellite` / `hybrid`. Спутник и гибрид без доступа к съёмке на ключе пустые |
| `customMapStyle` (Google JSON в `src/constants/map-style.ts`) | не переносится. Тёмная тема: `nightMode`. Свой стиль: строка Yandex JSON в `mapStyle`, только для `vector` и `hybrid` |
| `userInterfaceStyle` | `nightMode={colorScheme === 'dark'}` |
| `<Marker coordinate>` | `<Marker point={{ latitude, longitude }} onPress>`. Кастомный вид — `children`, картинка — `source` |
| `tracksViewChanges` | тот же проп, дефолт `true`. Для статичного пина выключать |
| `<Circle center radius>` | `<Circle center radius fillColor strokeColor>`. Радиус в метрах, есть во flavor `lite` |
| `getMapBoundaries()` / `getCamera()` | `getVisibleRegion()` (квад `topLeft` / `topRight` / `bottomLeft` / `bottomRight`) и `getCameraPosition()` |
| `googleRenderer: 'LEGACY'` | не нужен |

`CameraPosition` плоский: `{ latitude, longitude, zoom, azimuth?, tilt? }`, zoom примерно 0…21. Вложенного `point: { lat, lon }` нет.

Жесты наклона и поворота выключить (`tiltGesturesEnabled={false}`, `rotateGesturesEnabled={false}`), чтобы карта осталась плоской и север был сверху. Тогда `regionZoom` / `zoomToLatitudeDelta` (они уже есть: `src/utils/map.ts`, `src/utils/resolve-map-view-region.ts`) остаются годной связкой delta ↔ zoom.

### Bbox для API

`useStingsNearby`, `useMapWebSocket`, `useTabsRegionSubscription` и `nearby.tsx` ходят в `MapBounds` и `mapStore.region`. Их не переписывать.

Практичный путь: в `onRegionChangeComplete` (алиас библиотеки) по-прежнему писать `MapRegion` и считать bounds через текущий `regionToBounds`. `getVisibleRegion()` нужен, если алиас на устройстве разойдётся с видимым кадром: из квада брать min/max lat/lng. Поворот карты при этом должен быть выключен, иначе ось-выровненный bbox врёт.

Дебаунс 300 мс сейчас в двух местах, оба остаются:

- `MapContainer` → `useStingsNearby`
- `useTabsRegionSubscription` → сокет на вкладках «Карта» и «Рядом»

---

## 3. Файлы и объём работ

Потребители `react-native-maps` сейчас:

| Файл | Что рисует |
|---|---|
| `src/components/map/MapContainer.tsx` | карта, камера, стиль, тип подложки, оверлеи |
| `src/components/map/StingMarker.tsx` | жало. На Android — готовый bitmap, не React-children: New Architecture снимает View в ~100px и обрезает круг |
| `src/components/map/HiveCircle.tsx` | круг `radiusM` + бейдж |
| `src/components/map/HiveSeedMarker.tsx` | семя улья: круг + маркер |
| `src/components/map/PlaceMarker.tsx` | место |
| `src/components/map/EchoMarker.tsx` | эхо, до 300 штук |
| `src/components/map/OverviewClusterMarker.tsx` | кластер обзора города с сервера, не клиентская кластеризация |
| `src/components/partner/VenuePointMap.tsx` | точка заведения, `animateToRegion` |
| `src/utils/resolve-map-view-region.ts` | `getMapBoundaries` / `getCamera` |

Рядом, но без импорта карт: `src/constants/map-style.ts`, `src/config/env.ts`, `src/hooks/useMapMarkerTracking.ts`, `src/stores/mapStore.ts` (`mapType: 'standard' \| 'satellite'`).

### Фаза A — POC (1 день)

**Цель:** карта на Москве, точка пользователя, один маркер, пан/зум, чтение видимого региона в `MapRegion`.

| Файл | Действие |
|------|----------|
| `src/components/map/YandexMapView.tsx` | тонкая обёртка: камера, `showUserPosition`, `nightMode`, жест без tilt/rotate |
| `app/(tabs)/index.tsx` | временно вместо `MapContainer` |

**Критерий:** dev build iOS и Android, не симулятор как единственная проверка.

### Фаза B — `MapContainer` (2–3 дня)

| Файл | Изменения |
|------|-----------|
| `src/components/map/MapContainer.tsx` | `YandexMapView`, ref, `mapPadding` под таб-бар |
| `src/utils/map.ts` | `regionToCamera` / `cameraToRegion` рядом с уже существующим `regionZoom` |
| `src/utils/resolve-map-view-region.ts` | `getVisibleRegion` / `getCameraPosition` |
| `src/constants/map-style.ts` | Google JSON не использовать. Тёмная схема — `nightMode` или новый Yandex JSON |
| `src/stores/mapStore.ts` | `MapRegion` оставить. `HiveMapType` оставить, маппинг в `map` / `satellite` сделать в обёртке |

Сохранить:

- debounce 300 мс → `useStingsNearby`
- `pendingMapFocus` после публикации
- `pendingSavedRegion`
- `centerOnUserLocation`
- `LocationAccessGate`, оверлеи, `MapLocationButton`, `HiveBottomSheet`
- пороги обзора `OVERVIEW_ENTER_DELTA` / `OVERVIEW_EXIT_DELTA`

`Clusterer` из пакета не подменяет обзор города: кластеры приходят с сервера и по тапу зумят в заданный `MapRegion`.

### Фаза C — маркеры (2–3 дня)

| Файл | Изменения |
|------|-----------|
| `StingMarker.tsx` | `Marker`. На Android сначала проверить `children`; текущий bitmap-обход (`image={{ uri }}`) оставить, если view provider снова обрежет пин |
| `HiveCircle.tsx`, `HiveSeedMarker.tsx` | `Circle` + центральный `Marker` |
| `PlaceMarker.tsx`, `EchoMarker.tsx` | `Marker` |
| `OverviewClusterMarker.tsx` | обычный `Marker`, не `Clusterer` |
| `useMapMarkerTracking.ts` | перепроверить тайминги `tracksViewChanges` |

Библиотека обещает нативный view provider для React-children, без снимка в bitmap. На `react-native-maps` этот путь на Android уже ломался — это первый риск фазы C, не повод заранее рисовать все пины картинками.

### Фаза D — остальной клиент (1 день)

| Файл | Затронут? |
|------|-----------|
| `src/hooks/useMapWebSocket.ts` | нет, если в стор по-прежнему пишется `MapRegion` |
| `src/hooks/useStingsNearby.ts` | нет |
| `src/hooks/useTabsRegionSubscription.ts` | нет |
| `app/(tabs)/nearby.tsx` | нет, читает `mapStore.region` |
| `src/components/partner/VenuePointMap.tsx` | да. Та же обёртка, `setCenter` вместо `animateToRegion` |
| `src/config/env.ts` | убрать `isGoogleMapsConfigured` / `googleMapsApiKey` после удаления Google-плагина |
| `src/components/ui/GlassTabBar.tsx` | проверить, что карта не белеет и логотип не перекрыт |

### Фаза E — документация (0.5 дня)

| Файл | Действие |
|------|----------|
| `TECH_DOCS.md` | стек карт, env, dev build. Отдельного `RN_FRONTEND_TZ.md` больше нет |
| `.env.example` | `YANDEX_MAPKIT_API_KEY`, убрать `GOOGLE_MAPS_API_KEY` |
| `app.config.ts` | плагин MapKit вместо `react-native-maps` |
| `package.json` | без `react-native-maps` |

Тестов на карту нет (`vitest`). Мок пакета рассчитан на Jest (`expo-yandex-mapkit/mock`); подключать его только если появятся компонентные тесты.

---

## 4. Архитектура

Yandex API не размазывать по экранам. `MapRegion` остаётся типом стора.

```
src/components/map/
  MapContainer.tsx
  YandexMapView.tsx          ← пропсы Hive → YandexMapView
  StingMarker.tsx
  HiveCircle.tsx
  ...
  adapters/
    map-camera.ts            ← region ↔ camera ↔ bounds
```

`MapContainer` по-прежнему вызывает фокус в терминах `MapRegion` (500 мс). Перевод в `setCenter(..., { durationSeconds: 0.5 })` живёт в адаптере.

---

## 5. Чеклист тестирования

### Функциональность

- [ ] Первый запуск: карта на пользователе, не на дефолтной Москве, если GPS уже есть
- [ ] Отказ в геолокации — `LocationAccessGate`
- [ ] Pan/zoom → через 300 мс `GET /stings/nearby`
- [ ] Жала, семена, ульи (круг + счётчик), места
- [ ] Дальний зум → слой обзора, тап по кластеру приближает
- [ ] Эхо не роняет кадр на 300 маркерах
- [ ] Тап по жалу → `sting/[id]`
- [ ] Тап по улью → `HiveBottomSheet`
- [ ] Публикация → `pendingMapFocus`
- [ ] Сохранённое место → `pendingSavedRegion`
- [ ] «Моё местоположение»
- [ ] Переключатель схемы и спутника. Если съёмка на ключе выключена — кнопка спутника скрыта, а не пустая сетка
- [ ] Светлая и тёмная тема
- [ ] WebSocket: новое жало без рефетча
- [ ] Вкладка «Рядом» на тех же bounds
- [ ] `VenuePointMap`: сдвиг камеры и перетаскивание точки

### Платформы

- [ ] iOS dev build, устройство: liquid glass + карта + видимый логотип Яндекса
- [ ] Android dev build, устройство: нет белого/чёрного экрана, пины не обрезаны
- [ ] Повторная сборка после смены ключа. Второй `initialize` с другим ключом падает с `ERR_YANDEX_MAPKIT_REINIT` — ключ только на сборке

### Производительность

- [ ] 30+ жал и до 300 эхо: пан без лагов
- [ ] `tracksViewChanges={false}` у статичных пинов, без мерцания

---

## 6. Риски

| Риск | Вероятность | Что делать |
|------|-------------|------------|
| Спутник на бесплатном ключе пустой | высокая, если не включить съёмку | проверить ключ в фазе A; иначе оставить только схему |
| Google JSON стиль не ложится на MapKit | факт | `nightMode` или новый JSON |
| Android снова обрезает кастомный маркер | средняя | bitmap-путь из `StingMarker` |
| `onRegionChangeComplete` расходится с кадром | средняя | сверить с `getVisibleRegion` на устройстве |
| iOS Simulator рисует чёрную карту | средняя | устройство |
| Логотип под таб-баром | средняя | `logoPadding` + `mapPadding` |
| Рост DAU → платный MapKit | низкая на старте | кабинет Яндекса |
| Пакет молодой (npm с июля 2026, релиз 2.23.0 от 20 августа 2026) | средняя | тонкий адаптер; не вызывать search/routing |

Несовместимость с SDK 54 снята: проект на SDK 55, peer dependency пакета это покрывает.

---

## 7. Порядок

Апгрейд SDK 55 и этапы WebSocket / «Рядом» уже в коде. MapKit — отдельная ветка поверх текущего `main`/`develop`, без параллельных правок сокета и ленты.

```bash
git checkout -b feat/yandex-mapkit-poc
npx expo install expo-yandex-mapkit
# плагин в app.config.ts, ключ в .env
npx expo prebuild
npx expo run:ios
```

POC: `YandexMapView` + `showUserPosition` + один `Marker` на `DEFAULT_MAP_REGION` (Москва, `src/utils/map.ts`). Этот регион по-прежнему не использовать как стартовую камеру, если есть GPS.

---

## 8. Definition of Done

1. `react-native-maps` нет в зависимостях и в `plugins`
2. Dev build iOS и Android проходит чеклист выше
3. `YANDEX_MAPKIT_API_KEY` в EAS secrets и локальном `.env`, не в git
4. `GOOGLE_MAPS_API_KEY` убран из конфига, `.env.example` и `src/config/env.ts`
5. `TECH_DOCS.md` описывает MapKit
6. Логотип Яндекса виден в production-сборке и не перекрыт таб-баром
7. Спутник либо работает с ключом, у которого включена съёмка, либо кнопки спутника нет

---

## 9. Зачем менять

Карты Яндекса точнее для РФ и СНГ. Flavor `lite` закрывает текущий UI. Поиск и маршруты MapKit не нужны, пока свои API отдают жала и места.

Цена: девять файлов на `react-native-maps`, другая модель камеры, стиль карты пишется заново, Expo Go не подходит, спутник зависит от ключа. За пределами РФ/СНГ подложка слабее Google.

---

## Ссылки

- [Yandex MapKit](https://yandex.ru/maps-api/docs/mapkit/index.html)
- [Тарифы](https://yandex.ru/maps-api/tariffs)
- [expo-yandex-mapkit 2.23.0](https://www.npmjs.com/package/expo-yandex-mapkit)
- [Репозиторий](https://github.com/softwhere-uz/expo-yandex-mapkit)
- [react-native-yamap-plus](https://github.com/Qudaeo/react-native-yamap-plus) — запасной вариант, не основной
