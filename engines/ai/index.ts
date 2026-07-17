import type { AIInsight } from "./types";
import type { DailyBriefing } from "./briefing";
import type { ConnectionSuggestion, Opportunity, TopImpactAction } from "./coach-types";

export type { AIInsightPriority, AIInsight, AIContext, AIService } from "./types";
export type { DailyBriefing, CoachContext } from "./briefing";
export type { Opportunity, ConnectionSuggestion, TopImpactAction } from "./coach-types";
export type {
  CopilotContextPayload,
  CopilotOutputPayload,
  CopilotRunInput,
  CopilotRunResult,
  CopilotService,
} from "./copilot/types";
export { aiService, BelongAIService } from "./service";
export { copilotService, BelongCopilotService } from "./copilot/service";
export { buildCopilotContext } from "./copilot/context-builder";
export { AICoach, AIInsightPanel } from "./components/ai-coach";
export { CoachBriefing } from "./components/coach-briefing";
export { CopilotPanel } from "./components/copilot-panel";
export { generateDailyBriefing } from "./briefing";
export { detectOpportunities, suggestConnections } from "./opportunities";
