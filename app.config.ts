import { ConfigContext, ExpoConfig } from 'expo/config';

const PRODUCTION_API_URL = 'https://hive-backend-nodejs-production.up.railway.app/api/v1';
const PRODUCTION_WS_URL = 'wss://hive-backend-nodejs-production.up.railway.app/ws';

const LOCAL_API_URL = 'http://localhost:3000/api/v1';
const LOCAL_WS_URL = 'ws://localhost:3000/ws';

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

export default ({ config }: ConfigContext): ExpoConfig => {
  const { apiUrl, wsUrl } = resolveUrls();

  return {
    ...config,
    name: 'hive-app',
    slug: 'hive-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'hiveapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-localization',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
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
      apiUrl,
      wsUrl,
    },
  };
};
