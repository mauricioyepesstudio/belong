import {
  Bell,
  Building2,
  Calendar,
  Crown,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Sparkles,
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
  { label: "Opportunities", href: "/opportunities", icon: Sparkles },
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
  { label: "More", href: "#more", icon: Menu },
];

/** Routes surfaced in the mobile More menu (not in the bottom bar). */
export const mobileMoreNav: NavItem[] = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Organizations", href: "/organizations", icon: Building2 },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Creator", href: "/creator", icon: Crown },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const authRoutes = ["/login", "/register", "/forgot-password"] as const;

export const platformRoutes = [
  "/dashboard",
  "/organizations",
  "/missions",
  "/opportunities",
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
