"use client";

import {
  getRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { SoundToggle } from "@/components/features/notifications/sound-toggle";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { getNotificationPreferences, playSound, type SoundEvent } from "@/lib/sound";
import { getNotificationHref, NotificationRow, useToast } from "@/systems/design-system";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/database.types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

const RECENT_LIMIT = 8;

type NotificationBellProps = {
  userId: string;
  initialUnreadCount?: number;
  className?: string;
};

export function NotificationBell({
  userId,
  initialUnreadCount = 0,
  className,
}: NotificationBellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef(new Set<string>());

  // Initial small server fetch of recent notifications — only once, lazily
  // (on first open) so the bell doesn't add a request to every page load.
  const loadRecent = useCallback(() => {
    if (loaded) return;
    startTransition(async () => {
      const result = await getRecentNotifications(RECENT_LIMIT);
      if ("error" in result) return;
      for (const notification of result.notifications) knownIds.current.add(notification.id);
      setItems(result.notifications);
      setUnreadCount(result.unreadCount);
      setLoaded(true);
    });
  }, [loaded]);

  useEffect(() => {
    if (open) loadRecent();
  }, [open, loadRecent]);

  const onRealtime = useCallback(
    (notification: Notification) => {
      if (knownIds.current.has(notification.id)) return;
      knownIds.current.add(notification.id);
      const metadata = notification.metadata && typeof notification.metadata === "object" && !Array.isArray(notification.metadata) ? notification.metadata : {};
      const conversationId = typeof metadata.conversation_id === "string" ? metadata.conversation_id : undefined;
      const activeConversation = pathname === "/messages" && conversationId === searchParams.get("conversation");
      setItems((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [{ ...notification, read_at: activeConversation ? new Date().toISOString() : notification.read_at }, ...prev].slice(0, RECENT_LIMIT);
      });
      if (activeConversation) {
        void markNotificationRead(notification.id);
        return;
      }
      if (!notification.read_at) setUnreadCount((prev) => prev + 1);
      const interaction = typeof metadata.interaction_type === "string" ? metadata.interaction_type : "";
      const kind = typeof metadata.kind === "string" ? metadata.kind : "";
      const sound: SoundEvent = notification.type === "message" ? "new-message" : notification.type === "connection" ? (notification.title.toLowerCase().includes("accepted") ? "connection-accepted" : "connection-request-received") : interaction === "comment" ? "new-comment" : interaction === "support" ? "new-support" : kind.includes("goal") || kind.includes("mission") ? "mission-completed" : notification.type === "project" || notification.type === "community" ? "new-project-community" : "generic-success";
      const preferences = getNotificationPreferences();
      const inAppEnabled = notification.type === "message" ? preferences.inApp.messages : notification.type === "connection" ? preferences.inApp.connections : interaction === "comment" ? preferences.inApp.comments : interaction === "support" ? preferences.inApp.support : kind.includes("goal") || kind.includes("mission") ? preferences.inApp.missions : notification.type === "project" || notification.type === "community" ? preferences.inApp.projectsCommunities : true;
      if (!inAppEnabled) return;
      playSound(sound);
      const href = getNotificationHref(notification.type, notification.metadata);
      toast(
        notification.body ?? "Open BELONG to view.",
        "info",
        { label: "Open", onClick: () => router.push(href) },
        {
          title: notification.title,
          avatarUrl: typeof metadata.actor_avatar_url === "string" ? metadata.actor_avatar_url : null,
          avatarFallback: typeof metadata.actor_name === "string" ? metadata.actor_name.slice(0, 1).toUpperCase() : undefined,
        }
      );
      if (preferences.browserEnabled && document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
        const body = notification.type === "message" && !preferences.messagePreview ? "Open BELONG to read this message." : notification.body ?? "Open BELONG to view.";
        const systemNotification = new Notification(notification.title, { body, tag: notification.id });
        systemNotification.onclick = () => { window.focus(); router.push(href); systemNotification.close(); };
      }
    },
    [pathname, router, searchParams, toast]
  );

  useRealtimeNotifications(userId, onRealtime);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const markOne = (id: string, href: string) => {
    setOpen(false);
    const wasUnread = items.some((item) => item.id === id && !item.read_at);
    startTransition(async () => {
      const result = await markNotificationRead(id);
      if (result?.error) return;
      setItems((prev) => prev.map((n) => {
          return (
          n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n
          );
        })
      );
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
      router.push(href);
    });
  };

  const markAll = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result?.error) return;
      setItems((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    });
  };

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg-primary focus-ring"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-bg-overlay shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
              <p className="text-[13px] font-semibold text-fg-primary">Notifications</p>
              <div className="flex items-center gap-1">
                <SoundToggle />
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAll}
                    className="rounded-lg px-2 py-1 text-[11px] font-medium text-brand transition-colors hover:bg-brand/10"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[13px] text-fg-muted">
                    {loaded ? "No notifications yet" : "Loading…"}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border-subtle" role="list">
                  {items.map((n) => (
                    <li key={n.id} role="listitem">
                      <NotificationRow notification={n} onNavigate={markOne} compact />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-border-subtle px-3 py-2.5 text-center text-[12px] font-medium text-fg-secondary transition-colors hover:bg-bg-hover hover:text-fg-primary"
            >
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
