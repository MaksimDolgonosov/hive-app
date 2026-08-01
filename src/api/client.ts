import { create } from 'axios';

import { env } from '@/src/config/env';

export const apiClient = create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
