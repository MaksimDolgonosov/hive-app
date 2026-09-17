import { apiClient } from '@/src/api/client';
import type { RegisterDeviceInput } from '@/src/types';

export async function registerDevice(input: RegisterDeviceInput): Promise<void> {
  await apiClient.post('/devices', input);
}

export async function unregisterDevice(deviceId: string): Promise<void> {
  await apiClient.delete(`/devices/${encodeURIComponent(deviceId)}`);
}
