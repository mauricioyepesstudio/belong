"use client";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import {
  Button,
  Card,
  EmptyState,
  FeatureScreen,
  NotificationRow,
  Tabs,
  useToast,
} from "@/systems/design-system";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackClientEvent,
} from "@/systems/analytics";
import type { Notification } from "@/types/database.types";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

export function NotificationsView({
  notifications: initial,
  userId,
}: {
  notifications: Notification[];
  userId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState("all");
  const [isPending, startTransition] = useTransition();

  const unread = items.filter((n) => !n.read_at).length;

  const onRealtime = useCallback((notification: Notification) => {
    setItems((prev) => {
      if (prev.some((n) => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
  }, []);

  useRealtimeNotifications(userId, onRealtime);

  const filtered = useMemo(
    () => (tab === "unread" ? items.filter((n) => !n.read_at) : items),
    [tab, items]
  );

  const markAll = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result?.error) {
        toast(result.error, "error");
        return;
      }
      setItems((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
      toast("All notifications marked as read", "success");
      router.refresh();
    });
  };

  const markOne = (id: string, href: string) => {
    startTransition(async () => {
      const result = await markNotificationRead(id);
      if (result?.error) {
        toast(result.error, "error");
        return;
      }
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n
        )
      );

      await trackClientEvent({
        name: "notification_opened",
        userId,
        screen: AnalyticsScreen.NOTIFICATIONS,
        source: AnalyticsSource.NOTIFICATIONS_LIST,
        entityId: id,
      });

      router.push(href);
    });
  };

  const emptyTitle =
    items.length === 0
      ? "No notifications yet"
      : tab === "unread"
        ? "You're all caught up"
        : "All caught up";

  const emptyDescription =
    items.length === 0
      ? "Join a community or complete a mission — activity will show up here."
      : tab === "unread"
        ? "You have no unread notifications."
        : "Platform activity will appear here as you build.";

  const emptyAction =
    items.length === 0
      ? { label: "Explore communities", href: "/community" as const }
      : tab === "unread" && items.length > 0
        ? { label: "View all notifications", onClick: () => setTab("all") }
        : undefined;

  return (
    <FeatureScreen
      label="Notifications"
      title="Notifications"
      description={`${items.length} total · ${unread} unread`}
      action={
        <Button variant="secondary" size="sm" onClick={markAll} disabled={unread === 0 || isPending}>
          Mark all read
        </Button>
      }
      toolbar={
        <Tabs
          className="w-fit"
          tabs={[
            { id: "all", label: "All", count: items.length },
            { id: "unread", label: "Unread", count: unread },
          ]}
          active={tab}
          onChange={setTab}
        />
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border-subtle" role="list">
            {filtered.map((n) => (
              <li key={n.id} role="listitem">
                <NotificationRow
                  notification={n}
                  onNavigate={markOne}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </FeatureScreen>
  );
}
