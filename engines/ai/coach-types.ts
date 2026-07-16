export type Opportunity = {
  id: string;
  title: string;
  description: string;
  actionHref: string;
  impactLabel: string;
  priority: "high" | "medium" | "low";
};

export type ConnectionSuggestion = {
  id: string;
  name: string;
  reason: string;
  buildGoal: string | null;
  avatarUrl: string | null;
  actionHref: string;
};

export type TopImpactAction = {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  impactPoints: number;
  source: "mission" | "connection" | "opportunity" | "coach" | "event" | "message";
};
