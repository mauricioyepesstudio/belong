import {
  Bell,
  Building2,
  Calendar,
  Compass,
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
  { label: "Feed", href: "/feed", icon: Compass },
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
  { label: "Feed", href: "/feed", icon: Compass },
  { label: "Build", href: "/dashboard?build=open", icon: Sparkles },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "More", href: "#more", icon: Menu },
];

/** Reference-style bottom dock shown only on the Home/dashboard route. */
export const homeMobileNav: NavItem[] = [
  { label: "Explore", href: "/search", icon: Compass },
  { label: "Connect", href: "/people/discover", icon: Users },
  { label: "Build", href: "/dashboard?build=open", icon: Sparkles },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Profile", href: "/profile", icon: User },
];

/** Compact primary-destination nav shown in the top bar on the Home/dashboard route. */
export const homeTopNav: NavItem[] = [
  { label: "Today", href: "/dashboard", icon: LayoutDashboard },
  { label: "Journey", href: "/profile?tab=missions", icon: User },
  { label: "Builders", href: "/community?tab=people", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Communities", href: "/community", icon: Building2 },
  { label: "Opportunities", href: "/opportunities", icon: Sparkles },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Resources", href: "/marketplace", icon: ShoppingBag },
];

/** Routes surfaced in the mobile More menu (not in the bottom bar). */
export const mobileMoreNav: NavItem[] = [
  { label: "People", href: "/people/discover", icon: Users },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Communities", href: "/community", icon: Users },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Organizations", href: "/organizations", icon: Building2 },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Resources", href: "/marketplace", icon: ShoppingBag },
  { label: "Creator", href: "/creator", icon: Crown },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const authRoutes = ["/login", "/register", "/forgot-password"] as const;

export const platformRoutes = [
  "/dashboard",
  "/feed",
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
  "/collaborations",
  "/circles",
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
