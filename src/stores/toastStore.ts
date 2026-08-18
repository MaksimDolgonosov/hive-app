import { create } from 'zustand';

export type ToastType = 'error' | 'info';

export type ToastPayload = {
  title?: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
};

type ToastState = ToastPayload & {
  visible: boolean;
};

type ToastStore = ToastState & {
  show: (payload: ToastPayload) => void;
  hide: () => void;
};

const DEFAULT_DURATION_MS = 4500;

let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

export const useToastStore = create<ToastStore>((set) => ({
  visible: false,
  title: undefined,
  message: '',
  type: 'error',

  show: (payload) => {
    clearHideTimer();

    set({
      visible: true,
      title: payload.title,
      message: payload.message,
      type: payload.type ?? 'error',
    });

    hideTimer = setTimeout(() => {
      set({ visible: false });
      hideTimer = null;
    }, payload.durationMs ?? DEFAULT_DURATION_MS);
  },

  hide: () => {
    clearHideTimer();
    set({ visible: false });
  },
}));

export function showErrorToast(payload: ToastPayload): void {
  useToastStore.getState().show({ ...payload, type: 'error' });
}

export function showInfoToast(payload: ToastPayload): void {
  useToastStore.getState().show({ ...payload, type: 'info' });
}
