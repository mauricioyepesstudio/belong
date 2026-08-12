/** Screen identifiers for analytics — not tied to route structure. */
export const AnalyticsScreen = {
  REGISTER: "register",
  LOGIN: "login",
  ONBOARDING: "onboarding",
  DASHBOARD: "dashboard",
  COMMUNITY: "community",
  COMMUNITY_DETAIL: "community_detail",
  PROJECTS: "projects",
  PROJECT_DETAIL: "project_detail",
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications",
  PROFILE: "profile",
  SETTINGS: "settings",
  SEARCH: "search",
  OPPORTUNITIES: "opportunities",
  AUTH_CALLBACK: "auth_callback",
} as const;

export type AnalyticsScreenName = (typeof AnalyticsScreen)[keyof typeof AnalyticsScreen];

export function pathnameToScreen(pathname: string): string {
  if (pathname === "/dashboard") return AnalyticsScreen.DASHBOARD;
  if (pathname === "/register") return AnalyticsScreen.REGISTER;
  if (pathname === "/login") return AnalyticsScreen.LOGIN;
  if (pathname.startsWith("/onboarding")) return AnalyticsScreen.ONBOARDING;
  if (pathname === "/community") return AnalyticsScreen.COMMUNITY;
  if (pathname.startsWith("/community/")) return AnalyticsScreen.COMMUNITY_DETAIL;
  if (pathname === "/projects") return AnalyticsScreen.PROJECTS;
  if (pathname.startsWith("/projects/")) return AnalyticsScreen.PROJECT_DETAIL;
  if (pathname.startsWith("/messages")) return AnalyticsScreen.MESSAGES;
  if (pathname.startsWith("/notifications")) return AnalyticsScreen.NOTIFICATIONS;
  if (pathname.startsWith("/profile")) return AnalyticsScreen.PROFILE;
  if (pathname.startsWith("/settings")) return AnalyticsScreen.SETTINGS;
  if (pathname.startsWith("/search")) return AnalyticsScreen.SEARCH;
  if (pathname.startsWith("/opportunities")) return AnalyticsScreen.OPPORTUNITIES;
  return pathname.replace(/^\//, "").replace(/\//g, "_") || "unknown";
}
