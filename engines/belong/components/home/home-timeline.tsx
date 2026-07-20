"use client";

import type { HomeActivity } from "@/engines/belong/home/types";
import { Button } from "@/systems/design-system";
import { Activity, Plus, Users } from "lucide-react";
import { ActivityCard } from "./activity-card";
import { FadeIn } from "@/components/motion/fade-in";
import { GlassCard } from "../dashboard/primitives";

const START_STEPS = [
  "Join or create a community that fits your goals.",
  "Share your first idea or question with the group.",
  "Start a project or mission to turn ideas into action.",
];

export function HomeTimeline({
  activities,
  hasCommunities,
  onExplore,
  onCreateCommunity,
}: {
  activities: HomeActivity[];
  hasCommunities?: boolean;
  onExplore?: () => void;
  onCreateCommunity?: () => void;
}) {
  return (
    <section aria-labelledby="home-activity-heading">
      <div className="mb-4">
        <p className="text-label">Activity stream</p>
        <h2 id="home-activity-heading" className="text-heading mt-1 text-fg-primary">
          {hasCommunities ? "From your communities" : "Your activity will appear here"}
        </h2>
        <p className="mt-2 text-body text-fg-muted">
          {hasCommunities
            ? "Posts, projects, events, and collaborations from across BELONG."
            : "Once you join a community, real activity shows up in this feed."}
        </p>
      </div>

      {activities.length === 0 ? (
        <GlassCard className="overflow-hidden">
          <div className="flex flex-col items-center px-6 py-10 text-center md:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
              <Activity className="h-6 w-6 text-brand" aria-hidden />
            </div>
            <h3 className="mt-4 text-body-lg font-semibold text-fg-primary">
              {hasCommunities ? "No activity yet" : "Nothing here yet — and that's okay"}
            </h3>
            <p className="mt-2 max-w-md text-body text-fg-muted">
              {hasCommunities
                ? "Publish a post or join a project. Activity from your communities will show up here."
                : "Follow these steps to get your Home feed started."}
            </p>

            {!hasCommunities && (
              <ol className="mt-6 w-full max-w-md space-y-3 text-left">
                {START_STEPS.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-micro font-bold text-brand">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-fg-secondary">{step}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {onExplore && (
                <Button variant="brand" className="rounded-2xl" onClick={onExplore}>
                  <Users className="h-4 w-4" aria-hidden />
                  Join a community
                </Button>
              )}
              {onCreateCommunity && (
                <Button variant="outline" className="rounded-2xl" onClick={onCreateCommunity}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Create a community
                </Button>
              )}
            </div>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <FadeIn key={activity.id} delay={index * 0.02}>
              <ActivityCard activity={activity} />
            </FadeIn>
          ))}
        </div>
      )}
    </section>
  );
}
