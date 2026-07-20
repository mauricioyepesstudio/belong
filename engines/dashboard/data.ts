export { getHomeEngineData as getDashboardData, type HomeEngineData as DashboardData } from "@/engines/belong/data";
export { HomeScreen as DashboardScreen } from "@/engines/belong/components/home";

export type DashboardStats = {
  connections: number;
  pendingConnections: number;
  projects: number;
  communities: number;
  unreadNotifications: number;
  unreadMessages: number;
};

export type {
  ConversationPreview,
  EventWithMeta as DashboardEvent,
  ProjectWithMemberCount as DashboardProject,
  UserCommunity,
} from "@/lib/core";
