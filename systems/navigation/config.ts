import {
  Bell,
  Building2,
  Calendar,
  Crown,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShoppingBag,
  User,
  Users,
} from "lucide-react";
import type { NavItem } from "@/types";

export const mainNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Organizations", href: "/organizations", icon: Building2 },
  { label: "Community", href: "/community", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export const secondaryNav: NavItem[] = [
  { label: "Creator", href: "/creator", icon: Crown },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const mobileNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Community", href: "/community", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Alerts", href: "/notifications", icon: Bell },
];

export const authRoutes = ["/login", "/register", "/forgot-password"] as const;

export const platformRoutes = [
  "/dashboard",
  "/organizations",
  "/missions",
  "/community",
  "/projects",
  "/events",
  "/messages",
  "/notifications",
  "/profile",
  "/settings",
  "/pricing",
  "/marketplace",
  "/creator",
  "/billing",
  "/search",
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function withNotificationBadge<T extends NavItem>(
  items: T[],
  href: string,
  count: number
): T[] {
  if (count <= 0) return items;
  return items.map((item) =>
    item.href === href ? { ...item, badge: String(count) } : item
  );
}
