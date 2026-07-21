import type { ImpactEventModule, ImpactEventType } from "@/engines/identity/reputation/types";
import type { Json } from "@/types/database.types";

export type ImpactScoreEvent = {
  id: string;
  action: ImpactEventType;
  label: string;
  points: number;
  module: ImpactEventModule;
  sourceId: string | null;
  metadata: Json;
  createdAt: string;
};

export type ImpactScoreProfile = {
  totalScore: number;
  weeklyScore: number;
  monthlyScore: number;
  recentEvents: ImpactScoreEvent[];
};
