import { ConfigContext, ExpoConfig } from 'expo/config';

const PRODUCTION_API_URL = 'https://hive-backend-nodejs-production.up.railway.app/api/v1';
const PRODUCTION_WS_URL = 'wss://hive-backend-nodejs-production.up.railway.app/ws';

const LOCAL_API_URL = 'http://localhost:3000/api/v1';
const LOCAL_WS_URL = 'ws://localhost:3000/ws';

const SPLASH_IMAGE = './assets/images/splash.png';
const SPLASH_ICON = './assets/images/splash-icon.png';
const SPLASH_BACKGROUND = '#FFF8ED';
const SPLASH_DARK_BACKGROUND = '#2C1810';

function resolveUrls() {
  const isProduction = process.env.APP_ENV === 'production';

  if (isProduction) {
    return {
      apiUrl: process.env.API_URL ?? PRODUCTION_API_URL,
      wsUrl: process.env.WS_URL ?? PRODUCTION_WS_URL,
    };
  }

  return {
    apiUrl: process.env.API_URL ?? LOCAL_API_URL,
    wsUrl: process.env.WS_URL ?? LOCAL_WS_URL,
  };
}

function toGoogleOAuthScheme(clientId: string): string | null {
  if (!clientId.endsWith('.apps.googleusercontent.com')) {
    return null;
  }

  return `com.googleusercontent.apps.${clientId.replace('.apps.googleusercontent.com', '')}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const { apiUrl, wsUrl } = resolveUrls();
  // Public Android OAuth client ID — fallback needed because EAS cloud builds
  // do not load local .env, and the scheme must be baked into the APK.
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    '678948952262-i44jauudeqfeumnlpeh3hup1b26db6fu.apps.googleusercontent.com';
  const googleOAuthScheme = toGoogleOAuthScheme(googleAndroidClientId);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[app.config] API_URL =', apiUrl);
    console.log('[app.config] WS_URL =', wsUrl);
  }

  return {
    ...config,
    name: 'Hive',
    slug: 'hive-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: ['hiveapp', 'com.hive.app', ...(googleOAuthScheme ? [googleOAuthScheme] : [])],
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    platforms: ['ios', 'android'],
    splash: {
      image: SPLASH_IMAGE,
      resizeMode: 'cover',
      backgroundColor: SPLASH_BACKGROUND,
      dark: {
        image: SPLASH_ICON,
        backgroundColor: SPLASH_DARK_BACKGROUND,
      },
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.hive.app',
      icon: './assets/Hive.icon',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
    android: {
      package: 'com.hive.app',
      permissions: ['VIBRATE'],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
        },
      },
      icon: './assets/images/icon.png',
      adaptiveIcon: {
        backgroundColor: '#F5A623',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      ...(googleOAuthScheme
        ? {
            intentFilters: [
              {
                action: 'VIEW',
                data: [
                  {
                    scheme: googleOAuthScheme,
                    pathPrefix: '/oauth2redirect',
                  },
                ],
                category: ['BROWSABLE', 'DEFAULT'],
              },
            ],
          }
        : {}),
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-localization',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Hive использует геолокацию для отображения фото рядом с вами на карте.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'Hive использует камеру для публикации фото с вашего местоположения.',
          recordAudioAndroid: false,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Hive использует галерею для выбора фото профиля.',
          cameraPermission: 'Hive использует камеру для фото профиля.',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: SPLASH_BACKGROUND,
          image: SPLASH_IMAGE,
          enableFullScreenImage_legacy: true,
          resizeMode: 'cover',
          dark: {
            image: SPLASH_ICON,
            backgroundColor: SPLASH_DARK_BACKGROUND,
          },
          ios: {
            image: SPLASH_IMAGE,
            backgroundColor: SPLASH_BACKGROUND,
            enableFullScreenImage_legacy: true,
            dark: {
              image: SPLASH_ICON,
              backgroundColor: SPLASH_DARK_BACKGROUND,
            },
          },
          android: {
            image: SPLASH_ICON,
            imageWidth: 200,
            resizeMode: 'contain',
            backgroundColor: SPLASH_BACKGROUND,
            dark: {
              image: SPLASH_ICON,
              backgroundColor: SPLASH_DARK_BACKGROUND,
            },
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      eas: {
        projectId: '4dcecefa-fe54-4793-aa44-e3aec67c2bb3',
      },
      apiUrl,
      wsUrl,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
    },
  };
};
