"use client";

import { useEffect, useRef } from "react";
import { getRealtimeEngine } from "../realtime-engine";
import { realtimeChannels } from "../channels";

export function useMissionRealtime(handlers: {
  missionId: string;
  onMissionUpdate?: (row: Record<string, unknown>) => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const { missionId } = handlersRef.current;
    if (!missionId) return;

    const engine = getRealtimeEngine();
    return engine.subscribe({
      key: `mission:${missionId}`,
      channelName: realtimeChannels.mission(missionId),
      postgresChanges: [
        {
          event: "UPDATE",
          table: "missions",
          filter: `id=eq.${missionId}`,
        },
      ],
      onPostgresChange: (payload) => {
        if (payload.eventType === "UPDATE" && payload.new) {
          handlersRef.current.onMissionUpdate?.(payload.new as Record<string, unknown>);
        }
      },
    });
  }, [handlers.missionId]);
}
