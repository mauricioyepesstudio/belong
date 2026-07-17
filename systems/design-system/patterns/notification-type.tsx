import type { Json, NotificationType } from "@/types/database.types";
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
  const listingId = metaString(metadata, "listing_id");

  if (type === "message") return "/messages";
  if (type === "payment") return "/creator";
  if (projectId) return `/projects/${projectId}`;
  if (communitySlug) return `/community/${communitySlug}`;
  if (communityId) return "/community";
  if (listingId) return "/marketplace";

  return notificationTypeHrefs[type] ?? "/notifications";
}
