export type AIInsightPriority = "high" | "medium" | "low";

export type AIInsight = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  priority: AIInsightPriority;
};

export type AIContext = {
  connections: number;
  pendingConnections: number;
  projects: number;
  communities: number;
  unreadNotifications: number;
  unreadMessages: number;
  hasMission: boolean;
  buildGoal: string | null;
  impactLevel?: string;
  streak?: number;
};

export type AIService = {
  generateInsights(context: AIContext): AIInsight[];
};
