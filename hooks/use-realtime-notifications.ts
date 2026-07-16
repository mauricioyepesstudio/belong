"use client";

import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database.types";
import { useEffect } from "react";

export function useRealtimeNotifications(
  userId: string | null,
  onNotification: (notification: Notification) => void
) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNotification]);
}
