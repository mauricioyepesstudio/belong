import type {
  AICopilotActionType,
  AICopilotContextType,
} from "@/types/database.types";

export type CopilotDiscussionItem = {
  author: string;
  content: string;
  createdAt: string;
  comments: string[];
};

export type CopilotTaskItem = {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
};

export type CopilotMilestoneItem = {
  title: string;
  description?: string;
  targetDate?: string;
};

export type CopilotMissionSuggestion = {
  title: string;
  description: string;
  rationale: string;
};

export type CopilotAnnouncementDraft = {
  title: string;
  body: string;
};

export type CopilotWeeklySummary = {
  title: string;
  summary: string;
  highlights: string[];
};

export type CopilotContextPayload = {
  type: AICopilotContextType;
  id: string;
  slug?: string;
  name: string;
  description: string | null;
  userId: string;
  userName: string | null;
  userBuildGoal: string | null;
  userMissionTitle: string | null;
  userImpactLevel: string | null;
  discussions: CopilotDiscussionItem[];
  tasks: CopilotTaskItem[];
  milestones: { title: string; completed: boolean; targetDate: string | null }[];
  stats: Record<string, number | string>;
};

export type CopilotOutputPayload =
  | { kind: "summary"; text: string }
  | { kind: "tasks"; items: CopilotTaskItem[] }
  | { kind: "milestones"; items: CopilotMilestoneItem[] }
  | { kind: "missions"; items: CopilotMissionSuggestion[] }
  | { kind: "answer"; text: string }
  | { kind: "announcement"; draft: CopilotAnnouncementDraft }
  | { kind: "weekly_summary"; data: CopilotWeeklySummary };

export type CopilotRunInput = {
  context: CopilotContextPayload;
  actionType: AICopilotActionType;
  prompt?: string;
};

export type CopilotRunResult = {
  output: CopilotOutputPayload;
  model: string;
  tokensUsed: number | null;
  inputSummary: Record<string, unknown>;
};

export type CopilotService = {
  run(input: CopilotRunInput): Promise<CopilotRunResult>;
};
