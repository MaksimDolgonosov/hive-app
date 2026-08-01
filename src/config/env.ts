import Constants from 'expo-constants';

type AppExtra = {
  apiUrl: string;
  wsUrl: string;
};

function getExtra(): AppExtra {
  const extra = Constants.expoConfig?.extra as Partial<AppExtra> | undefined;

  if (!extra?.apiUrl || !extra?.wsUrl) {
    throw new Error('API_URL and WS_URL must be defined in app.config.ts extra');
  }

  return {
    apiUrl: extra.apiUrl,
    wsUrl: extra.wsUrl,
  };
}

export const env = getExtra();
