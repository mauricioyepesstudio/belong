"use client";

import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database.types";
import { useEffect } from "react";

// Multiple components (e.g. GlobalRealtimeFeedback + NotificationsView) can mount
// this hook for the same userId at the same time, and React StrictMode's dev-only
// mount/cleanup/mount cycle can also overlap two subscription attempts. Supabase's
// RealtimeClient dedupes channels by topic and will hand back an already-subscribed
// channel instance for a reused topic, which makes the subsequent `.on()` call throw
// ("cannot add `postgres_changes` callbacks ... after `subscribe()`"). Suffixing the
// topic with a per-subscription counter guarantees every subscribe attempt gets its
// own channel instance, so `.on()` always runs before `.subscribe()` on a fresh channel.
let subscriberSeq = 0;

export function useRealtimeNotifications(
  userId: string | null,
  onNotification: (notification: Notification) => void
) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}:${++subscriberSeq}`)
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
