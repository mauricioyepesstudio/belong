"use client";

import type { HomeActivity } from "@/engines/belong/home/types";
import { Button, EmptyState } from "@/systems/design-system";
import { Activity, Plus, Users } from "lucide-react";
import { ActivityCard } from "./activity-card";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeader } from "../dashboard/primitives";

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
    <section>
      <SectionHeader label="Activity Stream" title="What's happening across BELONG" />

      {activities.length === 0 ? (
        <div className="surface-glass rounded-3xl">
          <EmptyState
            icon={Activity}
            title={hasCommunities ? "No activity yet" : "Your journey starts here"}
            description={
              hasCommunities
                ? "Publish your first post, complete a mission, or join a project — real activity from your communities will show up here."
                : "Join or create a community, then publish a post. Your Home stream fills with real posts, projects, events, and collaborations."
            }
            className="border-0 bg-transparent py-12"
          />
          <div className="flex flex-wrap justify-center gap-3 px-6 pb-10">
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
