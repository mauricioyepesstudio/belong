"use client";

import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/database.types";
import { useEffect } from "react";

export function useRealtimeMessages(
  conversationId: string | null,
  onMessage: (message: Message) => void
) {
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onMessage]);
}
