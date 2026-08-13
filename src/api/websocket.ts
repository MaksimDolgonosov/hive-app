import { io, type Socket } from 'socket.io-client';

import { env } from '@/src/config/env';
import { queryClient } from '@/src/lib/query-client';
import type { Hive, MapBounds, Sting } from '@/src/types';
import {
  removeHiveFromNearbyQueries,
  removeStingFromNearbyQueries,
  updateStingReactionCount,
  upsertHiveInNearbyQueries,
  upsertStingInNearbyQueries,
} from '@/src/utils/stings-query-cache';

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

const SERVER_EVENTS = [
  'sting:created',
  'sting:expired',
  'hive:updated',
  'hive:dissolved',
  'sting:reaction',
] as const;

type ServerEvent = (typeof SERVER_EVENTS)[number];

interface EnvelopeMessage {
  type: string;
  payload: unknown;
}

function parseWsEndpoint(wsUrl: string): { origin: string; path: string } {
  const url = new URL(wsUrl);

  return {
    origin: `${url.protocol}//${url.host}`,
    path: url.pathname || '/ws',
  };
}

function logDev(message: string, details?: unknown): void {
  if (!__DEV__) {
    return;
  }

  if (details === undefined) {
    console.info(`[websocket] ${message}`);
    return;
  }

  console.info(`[websocket] ${message}`, details);
}

class WebSocketManager {
  private socket: Socket | null = null;
  private accessToken: string | null = null;
  private subscribedBounds: MapBounds | null = null;
  private shouldConnect = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(accessToken: string): void {
    const tokenChanged = this.accessToken !== accessToken;
    this.accessToken = accessToken;
    this.shouldConnect = true;

    if (this.socket?.connected && !tokenChanged) {
      return;
    }

    this.clearReconnectTimer();
    this.openSocket();
  }

  disconnect(): void {
    this.shouldConnect = false;
    this.accessToken = null;
    this.subscribedBounds = null;
    this.reconnectAttempt = 0;
    this.clearReconnectTimer();
    this.closeSocket();
  }

  setRegionSubscription(bounds: MapBounds | null): void {
    this.subscribedBounds = bounds;

    if (!this.socket?.connected) {
      return;
    }

    if (bounds) {
      this.emit('subscribe:region', bounds);
      return;
    }

    this.emit('unsubscribe:region', {});
  }

  private openSocket(): void {
    if (!this.shouldConnect || !this.accessToken) {
      return;
    }

    this.closeSocket();

    const { origin, path } = parseWsEndpoint(env.wsUrl);

    this.socket = io(origin, {
      path,
      auth: { token: this.accessToken },
      query: { token: this.accessToken },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10_000,
    });

    this.socket.on('connect', () => {
      logDev('connected');
      this.reconnectAttempt = 0;

      if (this.subscribedBounds) {
        this.emit('subscribe:region', this.subscribedBounds);
      }
    });

    this.socket.on('disconnect', (reason) => {
      logDev('disconnected', { reason });

      if (this.shouldConnect) {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      logDev('connect_error', error.message);

      if (this.shouldConnect) {
        this.scheduleReconnect();
      }
    });

    for (const event of SERVER_EVENTS) {
      this.socket.on(event, (payload) => {
        this.handleEvent(event, payload);
      });
    }

    this.socket.on('message', (message: EnvelopeMessage) => {
      if (!message?.type) {
        return;
      }

      this.handleEvent(message.type as ServerEvent, message.payload);
    });
  }

  private closeSocket(): void {
    if (!this.socket) {
      return;
    }

    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }

  private emit(type: string, payload: Record<string, unknown> | MapBounds): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit(type, payload);
  }

  private scheduleReconnect(): void {
    if (!this.shouldConnect || this.reconnectTimer) {
      return;
    }

    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      RECONNECT_MAX_MS,
    );

    this.reconnectAttempt += 1;
    logDev(`reconnect in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private handleEvent(type: string, payload: unknown): void {
    switch (type) {
      case 'sting:created':
        this.handleStingCreated(payload as { sting: Sting });
        return;
      case 'sting:expired':
        this.handleStingExpired(payload as { stingId: string; hiveId: string | null });
        return;
      case 'hive:updated':
        this.handleHiveUpdated(payload as { hive: Hive });
        return;
      case 'hive:dissolved':
        this.handleHiveDissolved(payload as { hiveId: string });
        return;
      case 'sting:reaction':
        this.handleStingReaction(payload as { stingId: string; reactionsCount: number });
        return;
      default:
        logDev('ignored event', { type });
    }
  }

  private handleStingCreated(payload: { sting: Sting }): void {
    if (!payload?.sting) {
      return;
    }

    upsertStingInNearbyQueries(queryClient, payload.sting);

    if (payload.sting.hiveId) {
      void queryClient.invalidateQueries({ queryKey: ['hive', payload.sting.hiveId] });
    }
  }

  private handleStingExpired(payload: { stingId: string; hiveId: string | null }): void {
    if (!payload?.stingId) {
      return;
    }

    removeStingFromNearbyQueries(queryClient, payload.stingId);

    if (payload.hiveId) {
      void queryClient.invalidateQueries({ queryKey: ['hive', payload.hiveId] });
    }
  }

  private handleHiveUpdated(payload: { hive: Hive }): void {
    if (!payload?.hive) {
      return;
    }

    upsertHiveInNearbyQueries(queryClient, payload.hive);
  }

  private handleHiveDissolved(payload: { hiveId: string }): void {
    if (!payload?.hiveId) {
      return;
    }

    removeHiveFromNearbyQueries(queryClient, payload.hiveId);
  }

  private handleStingReaction(payload: { stingId: string; reactionsCount: number }): void {
    if (!payload?.stingId) {
      return;
    }

    updateStingReactionCount(queryClient, payload.stingId, payload.reactionsCount);
  }
}

export const websocket = new WebSocketManager();
