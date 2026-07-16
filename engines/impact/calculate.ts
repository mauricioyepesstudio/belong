export type ImpactMetrics = {
  connections: number;
  projects: number;
  communities: number;
  eventsAttended: number;
  messagesSent: number;
  hasMission: boolean;
  profileComplete: boolean;
  fundingRaisedCents: number;
  earningsCents: number;
  subscriptionTier: "free" | "pro" | "creator";
  communityContributionPoints: number;
  founderReputation: number;
};

export type ImpactScore = {
  score: number;
  level: string;
  breakdown: { label: string; points: number }[];
};

export function calculateImpactScore(metrics: ImpactMetrics): ImpactScore {
  const breakdown: { label: string; points: number }[] = [];

  const add = (label: string, points: number) => {
    if (points > 0) breakdown.push({ label, points });
  };

  add("Connections", metrics.connections * 12);
  add("Projects", metrics.projects * 18);
  add("Communities", metrics.communities * 15);
  add("Events attended", metrics.eventsAttended * 10);
  add("Messages sent", Math.min(metrics.messagesSent, 100));
  if (metrics.hasMission) add("Mission defined", 30);
  if (metrics.profileComplete) add("Profile complete", 25);
  add("Project funding raised", Math.floor(metrics.fundingRaisedCents / 200));
  add("Creator earnings", Math.floor(metrics.earningsCents / 1000));
  add("Community contributions", Math.floor(metrics.communityContributionPoints / 2));
  add("Founder reputation", Math.floor(metrics.founderReputation / 5));
  if (metrics.subscriptionTier === "pro") add("Pro member", 40);
  if (metrics.subscriptionTier === "creator") add("Creator member", 80);

  const score = breakdown.reduce((sum, b) => sum + b.points, 0);

  let level = "Emerging";
  if (score >= 500) level = "Legend";
  else if (score >= 350) level = "Impact Builder";
  else if (score >= 200) level = "Momentum";
  else if (score >= 100) level = "Growing";
  else if (score >= 50) level = "Starting";

  return { score, level, breakdown };
}
