import type { AIInsight } from "./types";
import type { DailyBriefing } from "./briefing";
import type { ConnectionSuggestion, Opportunity, TopImpactAction } from "./coach-types";

export type { AIInsightPriority, AIInsight, AIContext, AIService } from "./types";
export type { DailyBriefing, CoachContext } from "./briefing";
export type { Opportunity, ConnectionSuggestion, TopImpactAction } from "./coach-types";
export { aiService, BelongAIService } from "./service";
export { AICoach, AIInsightPanel } from "./components/ai-coach";
export { CoachBriefing } from "./components/coach-briefing";
export { generateDailyBriefing } from "./briefing";
export { detectOpportunities, suggestConnections } from "./opportunities";
