import type { HomeEngineData } from "@/engines/belong/data";

export function buildTodaySummary(data: Pick<
  HomeEngineData,
  "missionEngine" | "stats" | "upcomingEvents" | "recentConversations" | "recentProjects"
>): string {
  const parts: string[] = [];

  const pendingMissions = data.missionEngine.dailyMissions.filter(
    (m) => m.status === "pending"
  ).length;
  if (pendingMissions > 0) {
    parts.push(
      `${pendingMissions} mission${pendingMissions === 1 ? "" : "s"} due today`
    );
  }

  const unreadMessages = data.recentConversations.filter((c) => c.unread).length;
  if (unreadMessages > 0) {
    parts.push(`${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`);
  }

  if (data.stats.pendingConnections > 0) {
    parts.push(
      `${data.stats.pendingConnections} connection request${data.stats.pendingConnections === 1 ? "" : "s"}`
    );
  }

  const activeProjects = data.recentProjects.filter(
    (p) => p.status === "active" || p.status === "planning"
  ).length;
  if (activeProjects > 0) {
    parts.push(`${activeProjects} active project${activeProjects === 1 ? "" : "s"}`);
  }

  const upcoming = data.upcomingEvents.filter((e) => {
    const start = new Date(e.starts_at);
    const weekOut = new Date();
    weekOut.setDate(weekOut.getDate() + 7);
    return start <= weekOut;
  }).length;
  if (upcoming > 0) {
    parts.push(`${upcoming} event${upcoming === 1 ? "" : "s"} this week`);
  }

  if (parts.length === 0) {
    return "You're all caught up — pick an action below to keep building.";
  }

  return parts.join(" · ");
}
