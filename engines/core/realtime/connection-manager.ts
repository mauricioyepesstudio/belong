"use client";

import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { RealtimeConnectionState, RealtimeSubscribeState } from "./types";

type StateListener = (state: RealtimeConnectionState) => void;

const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;

class ConnectionManager {
  private client: SupabaseClient<Database> | null = null;
  private state: RealtimeConnectionState = "disconnected";
  private listeners = new Set<StateListener>();
  private activeChannels = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryAttempt = 0;

  getClient(): SupabaseClient<Database> {
    if (!this.client) {
      this.client = createClient();
    }
    return this.client;
  }

  getState(): RealtimeConnectionState {
    return this.state;
  }

  onStateChange(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(next: RealtimeConnectionState) {
    if (this.state === next) return;
    this.state = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  handleChannelStatus(status: RealtimeSubscribeState) {
    switch (status) {
      case "SUBSCRIBED":
        this.activeChannels += 1;
        this.retryAttempt = 0;
        this.clearReconnectTimer();
        this.setState("connected");
        break;
      case "CHANNEL_ERROR":
      case "TIMED_OUT":
      case "CLOSED":
        this.activeChannels = Math.max(0, this.activeChannels - 1);
        if (this.activeChannels === 0) {
          this.setState("disconnected");
          this.scheduleReconnect();
        }
        break;
      default:
        break;
    }
  }

  handleChannelRemoved() {
    this.activeChannels = Math.max(0, this.activeChannels - 1);
    if (this.activeChannels === 0) {
      this.setState("disconnected");
    }
  }

  markReconnecting() {
    this.setState("reconnecting");
  }

  markConnecting() {
    this.setState("connecting");
  }

  scheduleReconnect(onReconnect?: () => void) {
    if (this.reconnectTimer) return;
    this.setState("reconnecting");
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * 2 ** this.retryAttempt,
      MAX_RECONNECT_DELAY_MS
    );
    this.retryAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      onReconnect?.();
    }, delay);
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

let manager: ConnectionManager | null = null;

export function getConnectionManager(): ConnectionManager {
  if (!manager) {
    manager = new ConnectionManager();
  }
  return manager;
}

export type { ConnectionManager };
