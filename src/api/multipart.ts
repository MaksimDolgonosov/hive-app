import { Platform } from 'react-native';

export function jpegFormFile(uri: string, name: string): { uri: string; type: string; name: string } {
  const resolved = Platform.OS === 'ios' && !uri.startsWith('file://') ? `file://${uri}` : uri;
  return { uri: resolved, type: 'image/jpeg', name };
}

export function multipartRequestConfig(timeoutMs = 90_000) {
  return {
    headers: { Accept: 'application/json' },
    timeout: timeoutMs,
    transformRequest: (data: FormData, headers?: Record<string, string>) => {
      if (headers) {
        delete headers['Content-Type'];
      }
      return data;
    },
  };
}
