import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { isAxiosError } from 'axios';

import { apiClient } from '@/src/api/client';

type ApiCheckState =
  | { status: 'loading' }
  | { status: 'ok'; httpStatus: number }
  | { status: 'error'; message: string };

export default function HomeScreen() {
  const [apiCheck, setApiCheck] = useState<ApiCheckState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function checkBackend() {
      try {
        await apiClient.get('/auth/me');
        if (!cancelled) {
          setApiCheck({ status: 'ok', httpStatus: 200 });
        }
      } catch (error) {
        if (cancelled) return;

        if (isAxiosError(error) && error.response) {
          setApiCheck({ status: 'ok', httpStatus: error.response.status });
          return;
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        setApiCheck({ status: 'error', message });
      }
    }

    void checkBackend();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-black">
      <Text className="text-3xl font-bold text-gray-900 dark:text-white">Hive</Text>
      <Text className="mt-2 text-center text-gray-500 dark:text-gray-400">
        Этап 0 — проверка подключения к backend
      </Text>

      <View className="mt-8 w-full max-w-sm rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        {apiCheck.status === 'loading' && (
          <View className="items-center gap-3 py-2">
            <ActivityIndicator />
            <Text className="text-gray-600 dark:text-gray-300">GET /auth/me …</Text>
          </View>
        )}

        {apiCheck.status === 'ok' && (
          <Text className="text-center text-green-600 dark:text-green-400">
            Backend доступен — HTTP {apiCheck.httpStatus}
          </Text>
        )}

        {apiCheck.status === 'error' && (
          <Text className="text-center text-red-600 dark:text-red-400">{apiCheck.message}</Text>
        )}
      </View>
    </View>
  );
}
