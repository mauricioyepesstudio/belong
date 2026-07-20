"use client";

import type { HomeActivity } from "@/engines/belong/home/types";
import { EmptyState } from "@/systems/design-system";
import { Activity } from "lucide-react";
import { ActivityCard } from "./activity-card";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeader } from "../dashboard/primitives";

export function HomeTimeline({
  activities,
  onExplore,
}: {
  activities: HomeActivity[];
  onExplore?: () => void;
}) {
  return (
    <section>
      <SectionHeader label="Activity Stream" title="What's happening across BELONG" />

      {activities.length === 0 ? (
        <div className="surface-glass rounded-3xl">
          <EmptyState
            icon={Activity}
            title="Your stream is ready"
            description="Posts, projects, events, collaborations, and achievements from across BELONG will appear here as your network grows."
            action={
              onExplore ? { label: "Explore communities", onClick: onExplore } : undefined
            }
            className="border-0 bg-transparent py-16"
          />
        </div>
      ) : (
        <div className="space-y-5">
          {activities.map((activity, index) => (
            <FadeIn key={activity.id} delay={index * 0.03}>
              <ActivityCard activity={activity} />
            </FadeIn>
          ))}
        </div>
      )}
    </section>
  );
}
