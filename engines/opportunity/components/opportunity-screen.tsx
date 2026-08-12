"use client";

import { HomeRecommendations } from "@/engines/belong/components/home";
import type { OpportunityRecommendations } from "@/engines/opportunity/types";
import { FeatureScreen } from "@/systems/design-system";
import { AnalyticsScreen, AnalyticsSource } from "@/systems/analytics";
import { ArrowRight, Compass, HeartHandshake, TrendingUp } from "lucide-react";

const PATHWAYS = [
  {
    icon: Compass,
    title: "Find where you fit",
    description: "See people and communities aligned with your skills, interests, and purpose.",
  },
  {
    icon: HeartHandshake,
    title: "Contribute now",
    description: "Open a project or mission and take a concrete next step with others.",
  },
  {
    icon: TrendingUp,
    title: "Grow through action",
    description: "Turn participation into visible progress, relationships, and impact.",
  },
] as const;

export function OpportunityScreen({
  recommendations,
  userId,
}: {
  recommendations: OpportunityRecommendations;
  userId: string;
}) {
  return (
    <FeatureScreen
      label="Opportunity radar"
      title="Turn what is happening into meaningful action"
      description="BELONG matches your strengths and purpose with people, communities, projects, and missions where you can contribute and grow."
    >
      <section aria-label="How opportunities work" className="grid gap-3 md:grid-cols-3">
        {PATHWAYS.map(({ icon: Icon, title, description }, index) => (
          <article
            key={title}
            className="rounded-2xl border border-border-subtle bg-white/[0.02] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-micro font-medium uppercase tracking-[0.16em] text-fg-muted">
                0{index + 1}
              </span>
            </div>
            <h2 className="mt-4 text-base font-semibold text-fg-primary">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-fg-muted">{description}</p>
            <ArrowRight className="mt-4 h-4 w-4 text-brand" aria-hidden />
          </article>
        ))}
      </section>

      <HomeRecommendations
        recommendations={recommendations}
        userId={userId}
        heading="Your best opportunities right now"
        description="Ranked from BELONG activity and your compatibility profile. Open the details to understand every match, then take action in the existing community, project, or mission."
        analyticsScreen={AnalyticsScreen.OPPORTUNITIES}
        analyticsSource={AnalyticsSource.RECOMMENDATION_OPPORTUNITIES}
      />
    </FeatureScreen>
  );
}
