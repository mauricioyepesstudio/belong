export type RippleRing = {
  label: string;
  value: number;
  max: number;
  color: string;
};

export type FounderReputation = {
  score: number;
  label: string;
  communitiesOwned: number;
  totalMembers: number;
  contributionsLogged: number;
};

export type WeeklyImpact = {
  points: number;
  missionsCompleted: number;
  goalsCompleted: number;
  contributionsLogged: number;
};

export type ImpactEngineData = {
  score: import("./calculate").ImpactScore;
  weeklyImpact: WeeklyImpact;
  ripple: RippleRing[];
  history: { date: string; score: number }[];
  founderReputation: FounderReputation;
  communityContributionPoints: number;
  nextLevelAt: number;
  progressToNext: number;
};
