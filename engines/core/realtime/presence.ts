"use client";

import { getRealtimeEngine } from "./realtime-engine";
import type { PresenceMeta, PresenceState, UnsubscribeFn } from "./types";

export function trackPresence(
  channelName: string,
  presenceKey: string,
  meta: PresenceMeta,
  handlers?: {
    onSync?: (state: PresenceState) => void;
    onJoin?: (key: string, presences: PresenceMeta[]) => void;
    onLeave?: (key: string, presences: PresenceMeta[]) => void;
  }
): UnsubscribeFn {
  return getRealtimeEngine().subscribe({
    key: `presence:${channelName}`,
    channelName,
    enablePresence: true,
    presenceKey,
    presenceMeta: meta,
    onPresenceSync: handlers?.onSync,
    onPresenceJoin: handlers?.onJoin,
    onPresenceLeave: handlers?.onLeave,
  });
}

export function countPresenceUsers(state: PresenceState): number {
  return Object.values(state).reduce((total, entries) => total + entries.length, 0);
}

export function listPresenceUsers(state: PresenceState): PresenceMeta[] {
  const seen = new Set<string>();
  const users: PresenceMeta[] = [];
  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      if (!seen.has(entry.user_id)) {
        seen.add(entry.user_id);
        users.push(entry);
      }
    }
  }
  return users;
}
