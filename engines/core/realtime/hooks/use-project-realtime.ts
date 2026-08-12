"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRealtimeEngine } from "../realtime-engine";
import { realtimeChannels } from "../channels";
import type { PresenceMeta, PresenceState } from "../types";
import { countPresenceUsers } from "../presence";

type ProjectRealtimeHandlers = {
  projectId: string;
  userId: string;
  userName: string | null;
  onPostInsert?: (row: Record<string, unknown>) => void;
  onCommentInsert?: (row: Record<string, unknown>) => void;
  onLikeInsert?: (row: Record<string, unknown>) => void;
  onMemberInsert?: (row: Record<string, unknown>) => void;
  onMemberDelete?: (row: Record<string, unknown>) => void;
  onTaskInsert?: (row: Record<string, unknown>) => void;
  onTaskUpdate?: (row: Record<string, unknown>) => void;
  onActivityInsert?: (row: Record<string, unknown>) => void;
  onDiscussionInsert?: (row: Record<string, unknown>) => void;
  onDiscussionReplyInsert?: (row: Record<string, unknown>) => void;
  onGoalUpdate?: (row: Record<string, unknown>) => void;
  onProjectUpdate?: (row: Record<string, unknown>) => void;
};

export function useProjectRealtime(handlers: ProjectRealtimeHandlers) {
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
    const { projectId, userId, userName } = handlersRef.current;
    if (!projectId || !userId) return;

    const engine = getRealtimeEngine();
    const channelName = realtimeChannels.project(projectId);
    const projectFilter = `project_id=eq.${projectId}`;
    const idFilter = `id=eq.${projectId}`;

    const presenceMeta: PresenceMeta = {
      user_id: userId,
      full_name: userName,
      online_at: new Date().toISOString(),
    };

    const unsubscribe = engine.subscribe({
      key: `project:${projectId}`,
      channelName,
      enablePresence: true,
      presenceKey: userId,
      presenceMeta,
      onPresenceSync: handlePresenceSync,
      postgresChanges: [
        { event: "INSERT", table: "project_posts", filter: projectFilter },
        { event: "INSERT", table: "project_post_comments" },
        { event: "INSERT", table: "project_post_likes" },
        { event: "INSERT", table: "project_members", filter: projectFilter },
        { event: "DELETE", table: "project_members", filter: projectFilter },
        { event: "INSERT", table: "project_tasks", filter: projectFilter },
        { event: "UPDATE", table: "project_tasks", filter: projectFilter },
        { event: "INSERT", table: "project_activity", filter: projectFilter },
        { event: "INSERT", table: "project_discussions", filter: projectFilter },
        { event: "INSERT", table: "project_discussion_replies" },
        { event: "UPDATE", table: "project_goals", filter: projectFilter },
        { event: "UPDATE", table: "projects", filter: idFilter },
      ],
      onPostgresChange: (payload) => {
        const row = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
        if (!row) return;

        switch (payload.table) {
          case "project_posts":
            if (payload.eventType === "INSERT") handlersRef.current.onPostInsert?.(row);
            break;
          case "project_post_comments":
            if (payload.eventType === "INSERT") handlersRef.current.onCommentInsert?.(row);
            break;
          case "project_post_likes":
            if (payload.eventType === "INSERT") handlersRef.current.onLikeInsert?.(row);
            break;
          case "project_members":
            if (payload.eventType === "INSERT") handlersRef.current.onMemberInsert?.(row);
            else if (payload.eventType === "DELETE") handlersRef.current.onMemberDelete?.(row);
            break;
          case "project_tasks":
            if (payload.eventType === "INSERT") handlersRef.current.onTaskInsert?.(row);
            else if (payload.eventType === "UPDATE") handlersRef.current.onTaskUpdate?.(row);
            break;
          case "project_activity":
            if (payload.eventType === "INSERT") handlersRef.current.onActivityInsert?.(row);
            break;
          case "project_discussions":
            if (payload.eventType === "INSERT") handlersRef.current.onDiscussionInsert?.(row);
            break;
          case "project_discussion_replies":
            if (payload.eventType === "INSERT") handlersRef.current.onDiscussionReplyInsert?.(row);
            break;
          case "project_goals":
            if (payload.eventType === "UPDATE") handlersRef.current.onGoalUpdate?.(row);
            break;
          case "projects":
            if (payload.eventType === "UPDATE") handlersRef.current.onProjectUpdate?.(row);
            break;
        }
      },
    });

    return unsubscribe;
  }, [handlers.projectId, handlers.userId, handlePresenceSync]);

  return { activeUsers, presenceState };
}
