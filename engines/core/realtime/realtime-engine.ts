"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getConnectionManager } from "./connection-manager";
import type {
  ManagedChannel,
  RealtimeConnectionState,
  RealtimeSubscriptionConfig,
  PresenceMeta,
  PresenceState,
  UnsubscribeFn,
} from "./types";

const MAX_CHANNEL_RETRIES = 8;

class RealtimeEngine {
  private channels = new Map<string, ManagedChannel>();
  private connectionManager = getConnectionManager();

  subscribe(config: RealtimeSubscriptionConfig): UnsubscribeFn {
    this.unsubscribe(config.key);
    this.attachChannel(config);
    return () => this.unsubscribe(config.key);
  }

  unsubscribe(key: string) {
    const managed = this.channels.get(key);
    if (!managed) return;

    // Remove ownership before Supabase emits CLOSED. This prevents the status
    // callback from scheduling a retry for a channel React already disposed.
    this.channels.delete(key);

    if (managed.retryTimer) {
      clearTimeout(managed.retryTimer);
    }

    this.connectionManager.getClient().removeChannel(managed.channel);
    this.connectionManager.handleChannelRemoved();
  }

  publish(channelName: string, event: string, payload: Record<string, unknown>) {
    const key = `broadcast:${channelName}:${event}`;
    let managed = this.channels.get(key);

    if (!managed) {
      managed = this.attachChannel({
        key,
        channelName,
        broadcastEvents: [event],
      });
    }

    void managed.channel.send({
      type: "broadcast",
      event,
      payload,
    });
  }

  onConnectionStateChange(listener: (state: RealtimeConnectionState) => void) {
    return this.connectionManager.onStateChange(listener);
  }

  private attachChannel(config: RealtimeSubscriptionConfig): ManagedChannel {
    const supabase = this.connectionManager.getClient();
    let channel: RealtimeChannel = config.enablePresence
      ? supabase.channel(config.channelName, {
          config: { presence: { key: config.presenceKey ?? config.key } },
        })
      : supabase.channel(config.channelName);

    for (const change of config.postgresChanges ?? []) {
      channel = channel.on(
        "postgres_changes",
        {
          event: change.event,
          schema: change.schema ?? "public",
          table: change.table,
          filter: change.filter,
        },
        (payload) => {
          config.onPostgresChange?.(payload);
        }
      );
    }

    for (const event of config.broadcastEvents ?? []) {
      channel = channel.on("broadcast", { event }, ({ payload }) => {
        config.onBroadcast?.(event, (payload ?? {}) as Record<string, unknown>);
      });
    }

    if (config.enablePresence) {
      channel = channel
        .on("presence", { event: "sync" }, () => {
          config.onPresenceSync?.(normalizePresenceState(channel.presenceState()));
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          config.onPresenceJoin?.(
            key,
            normalizePresenceEntries(newPresences)
          );
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          config.onPresenceLeave?.(
            key,
            normalizePresenceEntries(leftPresences)
          );
        });
    }

    const managed: ManagedChannel = {
      key: config.key,
      channel,
      config,
      retryCount: 0,
      retryTimer: null,
    };

    this.channels.set(config.key, managed);
    this.subscribeManaged(managed);
    return managed;
  }

  private subscribeManaged(managed: ManagedChannel) {
    this.connectionManager.markConnecting();
    managed.channel.subscribe(async (status) => {
      // Status events can arrive after removeChannel during navigation or
      // React Strict Mode remounts. Ignore callbacks from stale instances.
      if (this.channels.get(managed.key) !== managed) return;

      this.connectionManager.handleChannelStatus(status);

      if (status === "SUBSCRIBED") {
        managed.retryCount = 0;
        if (managed.config.enablePresence && managed.config.presenceMeta) {
          await managed.channel.track(managed.config.presenceMeta);
        }
        return;
      }

      if (
        (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") &&
        managed.retryCount < MAX_CHANNEL_RETRIES
      ) {
        managed.retryCount += 1;
        this.connectionManager.markReconnecting();
        if (managed.retryTimer) clearTimeout(managed.retryTimer);
        managed.retryTimer = setTimeout(() => {
          managed.retryTimer = null;
          if (this.channels.get(managed.key) !== managed) return;
          this.channels.delete(managed.key);
          this.connectionManager.getClient().removeChannel(managed.channel);
          this.attachChannel(managed.config);
        }, Math.min(1000 * 2 ** managed.retryCount, 30_000));
      }
    });
  }
}

let engine: RealtimeEngine | null = null;

function normalizePresenceEntries(entries: unknown): PresenceMeta[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => entry as PresenceMeta)
    .filter((entry) => typeof entry.user_id === "string");
}

function normalizePresenceState(state: unknown): PresenceState {
  if (!state || typeof state !== "object") return {};
  const normalized: PresenceState = {};
  for (const [key, entries] of Object.entries(state as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue;
    normalized[key] = entries
      .map((entry) => entry as PresenceMeta)
      .filter((entry) => typeof entry.user_id === "string");
  }
  return normalized;
}

export function getRealtimeEngine(): RealtimeEngine {
  if (!engine) {
    engine = new RealtimeEngine();
  }
  return engine;
}

export type { RealtimeEngine };
