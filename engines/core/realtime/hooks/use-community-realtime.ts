"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRealtimeEngine } from "../realtime-engine";
import { realtimeChannels } from "../channels";
import type { PresenceMeta, PresenceState } from "../types";
import { countPresenceUsers } from "../presence";

type CommunityRealtimeHandlers = {
  communityId: string;
  userId: string;
  userName: string | null;
  onPostInsert?: (row: Record<string, unknown>) => void;
  onCommentInsert?: (row: Record<string, unknown>) => void;
  onLikeInsert?: (row: Record<string, unknown>) => void;
  onMemberInsert?: (row: Record<string, unknown>) => void;
  onMemberDelete?: (row: Record<string, unknown>) => void;
};

export function useCommunityRealtime(handlers: CommunityRealtimeHandlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const [activeUsers, setActiveUsers] = useState(0);
  const [presenceState, setPresenceState] = useState<PresenceState>({});

  const handlePresenceSync = useCallback((state: PresenceState) => {
    setPresenceState(state);
    setActiveUsers(countPresenceUsers(state));
  }, []);

  useEffect(() => {
    const { communityId, userId, userName } = handlersRef.current;
    if (!communityId || !userId) return;

    const engine = getRealtimeEngine();
    const channelName = realtimeChannels.community(communityId);
    const filter = `community_id=eq.${communityId}`;

    const presenceMeta: PresenceMeta = {
      user_id: userId,
      full_name: userName,
      online_at: new Date().toISOString(),
    };

    const unsubscribe = engine.subscribe({
      key: `community:${communityId}`,
      channelName,
      enablePresence: true,
      presenceKey: userId,
      presenceMeta,
      onPresenceSync: handlePresenceSync,
      postgresChanges: [
        { event: "INSERT", table: "community_posts", filter },
        { event: "INSERT", table: "community_post_comments" },
        { event: "INSERT", table: "community_post_likes" },
        { event: "INSERT", table: "community_members", filter },
        { event: "DELETE", table: "community_members", filter },
      ],
      onPostgresChange: (payload) => {
        const row = payload.new ?? payload.old;
        if (!row) return;

        switch (payload.table) {
          case "community_posts":
            if (payload.eventType === "INSERT") {
              handlersRef.current.onPostInsert?.(row as Record<string, unknown>);
            }
            break;
          case "community_post_comments":
            if (payload.eventType === "INSERT") {
              handlersRef.current.onCommentInsert?.(row as Record<string, unknown>);
            }
            break;
          case "community_post_likes":
            if (payload.eventType === "INSERT") {
              handlersRef.current.onLikeInsert?.(row as Record<string, unknown>);
            }
            break;
          case "community_members":
            if (payload.eventType === "INSERT") {
              handlersRef.current.onMemberInsert?.(row as Record<string, unknown>);
            } else if (payload.eventType === "DELETE") {
              handlersRef.current.onMemberDelete?.(row as Record<string, unknown>);
            }
            break;
        }
      },
    });

    return unsubscribe;
  }, [handlers.communityId, handlers.userId, handlePresenceSync]);

  return { activeUsers, presenceState };
}
