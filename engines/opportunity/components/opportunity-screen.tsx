"use client";

import { HomeRecommendations } from "@/engines/belong/components/home";
import type { OpportunityRecommendations } from "@/engines/opportunity/types";
import { Badge, FeatureScreen } from "@/systems/design-system";
import { AnalyticsScreen, AnalyticsSource, trackClientEvent } from "@/systems/analytics";
import { recommendationActionLabel } from "@/components/features/recommendations/recommendation-action";
import { ArrowRight, Compass, HeartHandshake, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

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
  const topOpportunity = Object.values(recommendations)
    .flat()
    .sort((a, b) => b.score - a.score)[0];
  const topActionHref = topOpportunity?.meta?.actionHref ?? topOpportunity?.href;
  const topActionLabel =
    topOpportunity?.meta?.actionLabel ??
    (topOpportunity ? recommendationActionLabel(topOpportunity.category) : "Open opportunity");
  const topActionHint = topOpportunity?.meta?.actionHint;

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

      {topOpportunity && (
        <section
          aria-labelledby="next-best-opportunity-heading"
          className="relative overflow-hidden rounded-2xl border border-brand/30 bg-brand/10 p-5 sm:p-6"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(139,92,246,0.18),transparent_38%)]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_0_32px_rgba(139,92,246,0.35)]">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-label">Your next best move</p>
                  <Badge variant="outline" className="text-micro">
                    {topOpportunity.score}% match
                  </Badge>
                </div>
                <h2 id="next-best-opportunity-heading" className="mt-2 text-xl font-semibold text-fg-primary">
                  {topOpportunity.title}
                </h2>
                <p className="mt-1 text-sm text-fg-muted">
                  {topOpportunity.explanation.bullets[0]?.label ?? "A strong match based on your BELONG activity and profile."}
                </p>
                {topActionHint && (
                  <p className="mt-2 text-xs text-brand">{topActionHint}</p>
                )}
              </div>
            </div>
            <Link
              href={topActionHref ?? topOpportunity.href}
              onClick={() => {
                void trackClientEvent({
                  name: "recommendation_accepted",
                  userId,
                  screen: AnalyticsScreen.OPPORTUNITIES,
                  source: AnalyticsSource.RECOMMENDATION_OPPORTUNITIES,
                  entityId: topOpportunity.id,
                  properties: {
                    category: topOpportunity.category,
                    placement: "next_best_move",
                    action: topActionLabel,
                  },
                });
              }}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            >
              {topActionLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}

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
