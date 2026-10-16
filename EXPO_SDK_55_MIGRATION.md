# План миграции: Expo SDK 54 → SDK 55

Сейчас проект на **Expo SDK 54** (`expo ~54.0.35`, React Native `0.81.5`, React `19.1.0`). New Architecture уже включена, нативных папок `ios/` и `android/` в репозитории нет — сборка идёт через prebuild и EAS. Цель апгрейда: **SDK 55** (React Native **0.83**, React **19.2**), без смены карт на MapKit и без Hermes v1.

Оценка: **2–4 рабочих дня**, если `react-native-maps` и `expo-liquid-glass-view` соберутся с первой правкой конфига. Дольше, если придётся переписывать кастомные config plugins.

## Что уже совпадает с SDK 55

- New Architecture включена (`newArchEnabled: true`). Отдельный этап «сначала новая архитектура на 54» не нужен.
- Push уже через плагин `expo-notifications`, а не через удалённое поле `notification` в конфиге.
- Файлы читаются новым API `expo-file-system` (`File`, `Paths`).
- Звук затвора уже на `expo-audio`, пакета `expo-av` нет.
- `expo-blur` в `GlassSurface` не использует `experimentalBlurMethod`.
- Dev client и EAS уже есть (`eas.json`, CLI `>= 16`).

## Что сломается, если только поднять версию

| Место | Сейчас | В SDK 55 |
|---|---|---|
| Рантайм | RN 0.81 / React 19.1 | RN 0.83 / React 19.2 |
| Версии пакетов Expo | свои мажоры (`expo-camera ~17`, `expo-router ~6`, …) | все пакеты SDK становятся `~55.0.0` |
| `app.config.ts` | `newArchEnabled`, `edgeToEdgeEnabled` | оба поля убраны из схемы. Edge-to-edge на Android обязателен |
| Карты | `react-native-maps@1.20.1`, ключи в `ios.config.googleMapsApiKey` и `android.config.googleMaps` | нужен **`react-native-maps@1.27.2+`**. Ключи Google Maps переезжают в плагин `react-native-maps`. Версии 1.23–1.27.1 ломают prebuild: шаблон AppDelegate перешёл на `@main`, podspec `react-native-google-maps` удалён |
| Патчи | `patches/expo-image+3.0.11.patch`, `patches/expo-liquid-glass-view+0.1.11.patch` | `postinstall` упадёт, потому что `expo-image` сменит версию |
| Навигационная панель | `androidNavigationBar` и `setButtonStyleAsync` в `app/_layout.tsx` | API цвета фона, позиции и стиля кнопок — no-op. Конфиг переносится в плагин `expo-navigation-bar` |
| Сборка iOS | локальный Xcode / дефолтный образ EAS | минимум **Xcode 26**. EAS без явного `image` берёт **Xcode 26.2** |
| Node | в `package.json` не зафиксирован | `^20.19.4`, `^22.13.0`, `^24.3.0` или `^25.0.0` |
| `eas update` | если появится в CI | флаг `--environment` обязателен |

Патч `expo-image` только подменяет `tsconfig` пакета. Его почти наверняка можно удалить. Патч `expo-liquid-glass-view` вырезает Metal script phase — его надо перепроверить на новой сборке, имя файла от версии пакета не зависит.

## Порядок работ

### 1. Ветка и окружение

Отдельная ветка от текущего рабочего коммита. Перед `npm install` проверить Node. Локальные iOS-сборки — только на Xcode 26. Образ в `eas.json` можно не пинить: дефолт SDK 55 уже Xcode 26.2.

Hermes v1 не включать. В SDK 55 он собирает React Native из исходников и удлиняет билды.

### 2. Зависимости

```bash
npx expo install expo@^55.0.0 --fix
npx expo-doctor@latest
```

`expo install --fix` сам выровняет пакеты SDK, React, React Native, Reanimated, screens, gesture-handler, worklets, svg, safe-area, async-storage, netinfo, web. После этого вручную:

- `react-native-maps` — не оставлять `1.20.1`. Ставить ту версию, которую рекомендует `npx expo install react-native-maps` на SDK 55, и убедиться, что она **не ниже 1.27.2**.
- `nativewind@^4.2` можно оставить: v4 поддерживает SDK 55. Babel (`jsxImportSource: 'nativewind'` + `nativewind/babel`) и `metro.config.js` не трогать, пока `expo-doctor` и сборка не покажут конфликт.
- `expo-alternate-app-icons` и `expo-liquid-glass-view` — сторонние. Их мажор Expo не поднимет. После bump прогнать prebuild и посмотреть, компилируются ли они на Swift 6 (режим по умолчанию в Expo Modules Core 55).

`expo-server-sdk` — серверный пакет для пушей, к версии SDK приложения не привязан.

### 3. `app.config.ts`

Удалить:

- `newArchEnabled`
- `android.edgeToEdgeEnabled`

`splash` с `enableFullScreenImage_legacy` оставить и прогнать prebuild: если схема плагина `expo-splash-screen` это поле больше не принимает, убрать его и сверить светлый/тёмный сплэш на обеих платформах.

`app.config.ts` в SDK 55 транспилируется TypeScript проекта, а не внутренним sucrase. Комментарий в начале файла про дублирование `PUBLIC_SITE_HOST` после этого может стать неверным. Импорт из `legal/public-site.ts` подключать только если конфиг реально его резолвит; до проверки оставить константу на месте.

В `AGENTS.md` ссылку на доки сменить с `v54.0.0` на `v55.0.0` в том же PR.

### 4. Карты — отдельный обязательный шаг, не MapKit

Сейчас Google-ключ зашит в `ios.config` и `android.config`. В документации SDK 55 ключ задаётся плагином:

```ts
[
  'react-native-maps',
  {
    iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
    androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
  },
]
```

Старые поля `googleMapsApiKey` / `googleMaps` убрать, чтобы prebuild не зарегистрировал ключ дважды. В JS `PROVIDER_GOOGLE` нигде не стоит: на iOS сейчас Apple Maps, на Android — Google. Поведение провайдера не менять в этом PR.

Миграцию на Yandex MapKit из `YANDEX_MAPKIT_MIGRATION.md` в этот апгрейд не включать. `expo-yandex-mapkit` как раз ждёт SDK 55, но подключать его следующим PR, когда dev build на 55 уже открывает текущую карту.

### 5. Патчи и стекло

1. Удалить `patches/expo-image+3.0.11.patch` (и дубликат `expo-image+3.0.11 2.patch`, если он попадёт в коммит). Прогнать `patch-package`. Если TypeScript снова ругается на `expo-image`, патч переснять уже от версии 55.
2. Собрать iOS с текущим патчем `expo-liquid-glass-view`. Если Swift 6 или Metal phase падают — обновить пакет или временно оставить fallback `BlurView`, который в `GlassSurface` уже есть. На официальный `expo-glass-effect` в этом PR не переезжать: он только iOS 26 и это отдельная смена UI.
3. `plugins/with-blocked-microphone.js` завязан на класс `expo.modules.audio.service.AudioRecordingService`. В SDK 55 Android foreground service у `expo-audio` переписан. После prebuild проверить, что сервис всё ещё вырезается и разрешение микрофона не появляется.
4. `plugins/with-ios-orange-alternate-icon.js` перепроверить на новом Xcode project: копирование `Light.icon` и alternate icon в настройках.

### 6. Android system bars

`setButtonStyleAsync` в `app/_layout.tsx` на SDK 55 ничего не делает. `androidNavigationBar.backgroundColor` тоже.

Перенести то, что плагин ещё умеет, в config plugin `expo-navigation-bar`. Фон `#0B0A08` под системными жестами больше не задаётся этим API: цвет окна остаётся на `SystemUI.setBackgroundColorAsync`, его нужно заново проверить на Android 15/16 в светлой и тёмной теме.

`StatusBar` из `expo-status-bar` с одним `style` трогать не нужно. `backgroundColor` вы и так не используете.

### 7. Сборка

Старый dev client на SDK 54 новый бандл не загрузит.

```bash
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

Либо новые EAS-профили `development` и `preview`. Каталоги `ios/` и `android/` по-прежнему не коммитить.

## Проверка перед мержем

- `npm test`, `npm run lint`, `npx expo-doctor`
- Камера: снимок, вспышка, зум, звук затвора, микрофон не запрашивается
- Превью и загрузка фото (`expo-image-manipulator`, `expo-file-system`)
- Карта: маркеры, круги ульев, кластеры, геолокация, тёмная тема, Android без серого тайла
- Google Sign-In и схема OAuth, Apple Sign-In при `EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED=true`
- Пуш в dev build (в Expo Go на Android пуши теперь кидают ошибку, не warning)
- Диплинки `https://hive-app.site/i` и `/p`
- Сплэш light/dark, смена иконки Light
- Стекло на iOS (`GlassSurface`) и таббар поверх карты на Android
- Онбординг геолокации и камеры

## Что сознательно не делать в этом PR

- Hermes v1 и `buildReactNativeFromSource`
- Перенос `app/` в `src/app` и переход на Native Tabs из нового шаблона
- Замена `react-native-maps` на `expo-maps` или Yandex MapKit
- Включение `enableBsdiffPatchSupport`: в проекте нет `expo-updates`
