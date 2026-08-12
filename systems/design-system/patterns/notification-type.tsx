import type { Json, NotificationType } from "@/types/database.types";
import { appLinks } from "@/systems/navigation/app-links";
import {
  Bell,
  Calendar,
  CreditCard,
  FolderKanban,
  MessageSquare,
  UserPlus,
  Users,
} from "lucide-react";

export const notificationTypeIcons = {
  connection: UserPlus,
  project: FolderKanban,
  event: Calendar,
  community: Users,
  message: MessageSquare,
  system: Bell,
  payment: CreditCard,
} as const satisfies Record<NotificationType, typeof Bell>;

export const notificationTypeHrefs: Record<NotificationType, string> = {
  connection: "/community",
  project: "/projects",
  event: "/events",
  community: "/community",
  message: "/messages",
  system: "/notifications",
  payment: "/creator",
};

export function getNotificationIcon(type: NotificationType) {
  return notificationTypeIcons[type] ?? Bell;
}

function metaString(metadata: Json | undefined, key: string): string | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}

export function getNotificationHref(type: NotificationType, metadata?: Json): string {
  const communitySlug = metaString(metadata, "slug");
  const communityId = metaString(metadata, "community_id");
  const projectId = metaString(metadata, "project_id");
  const postId = metaString(metadata, "post_id");
  const listingId = metaString(metadata, "listing_id");
  const missionId = metaString(metadata, "mission_id");
  const kind = metaString(metadata, "kind");

  if (missionId) return `/missions/${missionId}`;
  if (kind === "weekly_goal" || kind === "quarterly_goal") return appLinks.weeklyGoals;
  if (type === "message") {
    const conversationId = metaString(metadata, "conversation_id");
    if (conversationId) return `/messages?conversation=${conversationId}`;
    return "/messages";
  }
  if (type === "payment") return "/creator";
  if (projectId && postId) {
    return `/projects/${projectId}?tab=activity&post=${encodeURIComponent(postId)}#post-${encodeURIComponent(postId)}`;
  }
  if (projectId) return `/projects/${projectId}`;
  if (communitySlug) return `/community/${communitySlug}`;
  if (communityId) return "/community";
  if (listingId) return `/marketplace/${listingId}`;
  const eventId = metaString(metadata, "event_id");
  if (eventId) return `/events/${eventId}`;

  return notificationTypeHrefs[type] ?? "/notifications";
}
