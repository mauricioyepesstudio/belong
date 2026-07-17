import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  REALTIME_SUBSCRIBE_STATES,
} from "@supabase/supabase-js";

export type RealtimeConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export type PostgresChangeConfig = {
  event: PostgresChangeEvent;
  schema?: string;
  table: string;
  filter?: string;
};

export type PresenceMeta = {
  user_id: string;
  full_name?: string | null;
  online_at?: string;
};

export type PresenceState = Record<string, PresenceMeta[]>;

export type RealtimeBroadcastPayload = {
  event: string;
  payload: Record<string, unknown>;
};

export type RealtimeSubscriptionConfig = {
  key: string;
  channelName: string;
  postgresChanges?: PostgresChangeConfig[];
  broadcastEvents?: string[];
  enablePresence?: boolean;
  presenceKey?: string;
  presenceMeta?: PresenceMeta;
  onPostgresChange?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onBroadcast?: (event: string, payload: Record<string, unknown>) => void;
  onPresenceSync?: (state: PresenceState) => void;
  onPresenceJoin?: (key: string, newPresences: PresenceMeta[]) => void;
  onPresenceLeave?: (key: string, leftPresences: PresenceMeta[]) => void;
};

export type UnsubscribeFn = () => void;

export type RealtimeSubscribeState =
  (typeof REALTIME_SUBSCRIBE_STATES)[keyof typeof REALTIME_SUBSCRIBE_STATES];

export type ManagedChannel = {
  key: string;
  channel: RealtimeChannel;
  config: RealtimeSubscriptionConfig;
  retryCount: number;
  retryTimer: ReturnType<typeof setTimeout> | null;
};
