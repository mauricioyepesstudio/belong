"use client";

import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { useSound } from "@/components/providers/sound-provider";
import { getNotificationHref, useToast } from "@/systems/design-system";
import type { Notification } from "@/types/database.types";
import { useCallback, useRef } from "react";

type GlobalRealtimeFeedbackProps = {
  userId: string | null;
  onNotification: (isMessage: boolean) => void;
};

function metadataRecord(notification: Notification): Record<string, unknown> {
  return notification.metadata && typeof notification.metadata === "object" && !Array.isArray(notification.metadata)
    ? notification.metadata as Record<string, unknown>
    : {};
}

export function GlobalRealtimeFeedback({ userId, onNotification }: GlobalRealtimeFeedbackProps) {
  const { toast } = useToast();
  const { play } = useSound();
  const seen = useRef(new Set<string>());

  const handleNotification = useCallback((notification: Notification) => {
    if (seen.current.has(notification.id)) return;
    seen.current.add(notification.id);
    const metadata = metadataRecord(notification);
    const isMessage = notification.type === "message";
    const accepted = notification.type === "connection" &&
      ("connected_user_id" in metadata || notification.title.toLowerCase().includes("accepted"));

    onNotification(isMessage);
    play(isMessage ? "message" : accepted ? "connection-accepted" : "notification");
    toast(notification.title, "info", {
      label: isMessage ? "Open conversation" : accepted ? "Message them" : "View",
      onClick: () => {
        const href = getNotificationHref(notification.type, notification.metadata);
        if (href) window.location.href = href;
      },
    });
  }, [onNotification, play, toast]);

  useRealtimeNotifications(userId, handleNotification);
  return null;
}
