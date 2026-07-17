"use client";

import { useEffect, useRef } from "react";
import { getRealtimeEngine } from "../realtime-engine";
import { realtimeChannels } from "../channels";
import type { ImpactEvent } from "@/engines/identity/reputation";

type IdentityRealtimeHandlers = {
  userId: string;
  onImpactInsert?: (event: ImpactEvent) => void;
};

function mapImpactRow(row: Record<string, unknown>): ImpactEvent {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    module: row.module as ImpactEvent["module"],
    eventType: row.event_type as ImpactEvent["eventType"],
    points: Number(row.points),
    sourceId: row.source_id ? String(row.source_id) : null,
    metadata: (row.metadata ?? {}) as ImpactEvent["metadata"],
    createdAt: String(row.created_at),
  };
}

export function useIdentityRealtime(handlers: IdentityRealtimeHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const { userId } = handlersRef.current;
    if (!userId) return;

    const engine = getRealtimeEngine();
    const channelName = realtimeChannels.identity(userId);

    return engine.subscribe({
      key: `identity:${userId}`,
      channelName,
      postgresChanges: [
        {
          event: "INSERT",
          table: "impact_events",
          filter: `user_id=eq.${userId}`,
        },
      ],
      onPostgresChange: (payload) => {
        if (payload.eventType !== "INSERT" || !payload.new) return;
        handlersRef.current.onImpactInsert?.(
          mapImpactRow(payload.new as Record<string, unknown>)
        );
      },
    });
  }, [handlers.userId]);
}

export function useDashboardRealtime(handlers: IdentityRealtimeHandlers & {
  onMissionUpdate?: (row: Record<string, unknown>) => void;
  onProjectUpdate?: (row: Record<string, unknown>) => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const { userId } = handlersRef.current;
    if (!userId) return;

    const engine = getRealtimeEngine();
    const channelName = realtimeChannels.dashboard(userId);

    return engine.subscribe({
      key: `dashboard:${userId}`,
      channelName,
      postgresChanges: [
        {
          event: "INSERT",
          table: "impact_events",
          filter: `user_id=eq.${userId}`,
        },
        {
          event: "UPDATE",
          table: "missions",
          filter: `user_id=eq.${userId}`,
        },
        {
          event: "UPDATE",
          table: "projects",
          filter: `owner_id=eq.${userId}`,
        },
      ],
      onPostgresChange: (payload) => {
        const row = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
        if (!row) return;

        if (payload.table === "impact_events" && payload.eventType === "INSERT") {
          handlersRef.current.onImpactInsert?.(mapImpactRow(row));
        } else if (payload.table === "missions" && payload.eventType === "UPDATE") {
          handlersRef.current.onMissionUpdate?.(row);
        } else if (payload.table === "projects" && payload.eventType === "UPDATE") {
          handlersRef.current.onProjectUpdate?.(row);
        }
      },
    });
  }, [handlers.userId]);
}
