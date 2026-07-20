"use client";

import type { HomeActivity } from "@/engines/belong/home/types";
import { EmptyState } from "@/systems/design-system";
import { Activity } from "lucide-react";
import { ActivityCard } from "./activity-card";
import { FadeIn } from "@/components/motion/fade-in";

export function HomeTimeline({
  activities,
  onExplore,
}: {
  activities: HomeActivity[];
  onExplore?: () => void;
}) {
  if (activities.length === 0) {
    return (
      <div className="surface-glass rounded-3xl">
        <EmptyState
          icon={Activity}
          title="Your Home is ready"
          description="Join a community, start a project, or share your first thought — collaborative activity from across BELONG will appear here."
          action={
            onExplore
              ? { label: "Explore communities", onClick: onExplore }
              : undefined
          }
          className="border-0 bg-transparent py-16"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {activities.map((activity, index) => (
        <FadeIn key={activity.id} delay={index * 0.03}>
          <ActivityCard activity={activity} />
        </FadeIn>
      ))}
    </div>
  );
}
