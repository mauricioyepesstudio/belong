/** Stable in-app destinations — avoid dashboard hash links that target removed anchors. */
export const appLinks = {
  dashboardMissions: "/dashboard#missions",
  profileMissions: "/profile?tab=missions",
  profileSettings: "/settings?tab=profile",
  weeklyGoals: "/profile?tab=missions",
  lifeMission: "/settings?tab=profile",
} as const;

export function communityHref(slug: string | null | undefined): string {
  return slug ? `/community/${slug}` : "/community";
}
