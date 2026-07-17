"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRealtimeEngine } from "../realtime-engine";
import { realtimeChannels } from "../channels";

type TypingUser = {
  userId: string;
  fullName: string | null;
};

export function useTypingIndicator(options: {
  discussionId: string;
  userId: string;
  fullName: string | null;
}) {
  const { discussionId, userId, fullName } = options;
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearTypingUser = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    setTypingUsers((prev) => prev.filter((u) => u.userId !== id));
  }, []);

  const markTyping = useCallback(
    (targetUserId: string, targetName: string | null) => {
      if (targetUserId === userId) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === targetUserId)) return prev;
        return [...prev, { userId: targetUserId, fullName: targetName }];
      });
      const existing = timersRef.current.get(targetUserId);
      if (existing) clearTimeout(existing);
      timersRef.current.set(
        targetUserId,
        setTimeout(() => clearTypingUser(targetUserId), 3000)
      );
    },
    [clearTypingUser, userId]
  );

  const broadcastTyping = useCallback(() => {
    getRealtimeEngine().publish(realtimeChannels.discussion(discussionId), "typing", {
      user_id: userId,
      full_name: fullName,
    });
  }, [discussionId, fullName, userId]);

  useEffect(() => {
    if (!discussionId) return;

    const channelName = realtimeChannels.discussion(discussionId);
    const unsubscribe = getRealtimeEngine().subscribe({
      key: `typing:${discussionId}`,
      channelName,
      broadcastEvents: ["typing"],
      onBroadcast: (_event, payload) => {
        markTyping(String(payload.user_id), (payload.full_name as string | null) ?? null);
      },
    });

    return () => {
      unsubscribe();
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, [discussionId, markTyping]);

  return { typingUsers, broadcastTyping };
}
