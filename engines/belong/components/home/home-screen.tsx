"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { ConnectionStatus, LiveBadge, useDashboardRealtime } from "@/engines/core/realtime";
import { useState } from "react";
import { HomeComposer } from "./home-composer";
import { HomeTimeline } from "./home-timeline";
import { DiscoveryPanel } from "./discovery-panel";
import { DashboardActions } from "../dashboard/dashboard-actions";
import { FadeIn } from "@/components/motion/fade-in";
import { personalizedGreeting } from "@/engines/belong/recommendation";

export function HomeScreen(data: HomeEngineData) {
  const {
    profile,
    communities,
    discoverCommunities,
    homeTimeline,
    homeDiscovery,
  } = data;

  const [missionOpen, setMissionOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);

  useDashboardRealtime({ userId: profile.id });

  const firstName = profile.full_name?.split(" ")[0] ?? "Builder";
  const greeting = personalizedGreeting(firstName);

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-label">BELONG Home</p>
            <h1 className="text-heading-lg mt-1 text-fg-primary">{greeting}</h1>
            <p className="mt-2 max-w-xl text-body text-fg-secondary">
              Express ideas, discover opportunities, and build measurable impact — together.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LiveBadge label="Live" />
            <ConnectionStatus />
          </div>
        </div>
      </FadeIn>

      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-6 xl:max-w-2xl">
          <HomeComposer profile={profile} />
          <HomeTimeline
            activities={homeTimeline}
            onExplore={() => setCommunityOpen(true)}
          />
        </div>

        <aside className="w-full shrink-0 xl:sticky xl:top-[calc(var(--header-height)+1.5rem)] xl:w-80">
          <DiscoveryPanel discovery={homeDiscovery} />
        </aside>
      </div>

      <DashboardActions
        joinedCommunities={communities}
        discoverCommunities={discoverCommunities}
        missionOpen={missionOpen}
        onMissionOpenChange={setMissionOpen}
        projectOpen={projectOpen}
        onProjectOpenChange={setProjectOpen}
        communityOpen={communityOpen}
        onCommunityOpenChange={setCommunityOpen}
      />
    </div>
  );
}
