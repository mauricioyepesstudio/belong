export { getConnectionManager } from "./connection-manager";
export { getRealtimeEngine } from "./realtime-engine";
export { trackPresence, countPresenceUsers, listPresenceUsers } from "./presence";
export { realtimeChannels } from "./channels";

export type {
  RealtimeConnectionState,
  RealtimeSubscriptionConfig,
  PresenceMeta,
  PresenceState,
  UnsubscribeFn,
} from "./types";

export { useConnectionStatus } from "./hooks/use-connection-status";
export { useCommunityRealtime } from "./hooks/use-community-realtime";
export { useProjectRealtime } from "./hooks/use-project-realtime";
export { useIdentityRealtime, useDashboardRealtime } from "./hooks/use-identity-realtime";
export { useMissionRealtime } from "./hooks/use-mission-realtime";
export { useTypingIndicator } from "./hooks/use-typing-indicator";

export { LiveBadge } from "./components/live-badge";
export { ConnectionStatus } from "./components/connection-status";
export { TypingIndicator } from "./components/typing-indicator";

export {
  dedupeById,
  fetchAuthorMeta,
  mapCommunityPostRow,
  mapProjectPostRow,
  mapProjectTaskRow,
  mapProjectActivityRow,
  mapProjectDiscussionRow,
} from "./helpers";
