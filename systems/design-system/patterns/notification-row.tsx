import { getNotificationHref, getNotificationIcon } from "@/systems/design-system/patterns/notification-type";
import { UnreadDot } from "@/systems/design-system/patterns/unread-dot";
import { formatDistanceToNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/database.types";
import Link from "next/link";

type NotificationRowProps = {
  notification: Notification;
  onNavigate?: (id: string, href: string) => void;
  compact?: boolean;
};

export function NotificationRow({ notification, onNavigate, compact }: NotificationRowProps) {
  const Icon = getNotificationIcon(notification.type);
  const href = getNotificationHref(notification.type, notification.metadata);
  const isUnread = !notification.read_at;

  const content = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isUnread ? "bg-brand/10 text-brand" : "bg-bg-hover text-fg-muted"
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            isUnread ? "font-semibold text-fg-primary" : "text-fg-secondary"
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className={cn("text-fg-muted", compact ? "mt-0.5 line-clamp-1 text-xs" : "mt-0.5 line-clamp-2 text-xs")}>
            {notification.body}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isUnread && <UnreadDot />}
        <span className="text-xs text-fg-faint">
          {formatDistanceToNow(notification.created_at)}
        </span>
      </div>
    </>
  );

  if (onNavigate) {
    return (
      <button
        type="button"
        className="flex w-full items-start gap-4 px-2 py-3.5 text-left transition-colors hover:bg-bg-hover"
        onClick={() => onNavigate(notification.id, href)}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-start gap-4 px-2 py-3.5 transition-colors hover:bg-bg-hover"
    >
      {content}
    </Link>
  );
}
