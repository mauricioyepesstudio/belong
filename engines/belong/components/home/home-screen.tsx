"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { useDashboardRealtime } from "@/engines/core/realtime";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeComposer } from "./home-composer";
import { HomeTimeline } from "./home-timeline";
import { DiscoveryPanel } from "./discovery-panel";
import { HomeHero, type QuickActionId } from "./home-hero";
import { HomeImpactMetrics } from "./home-impact-metrics";
import { DashboardActions } from "../dashboard/dashboard-actions";

export function HomeScreen(data: HomeEngineData) {
  const router = useRouter();
  const composerRef = useRef<HTMLDivElement>(null);
  const {
    profile,
    communities,
    discoverCommunities,
    homeTimeline,
    homeDiscovery,
    homeImpactMetrics,
    primaryRecommendation,
    missionEngine,
  } = data;

  const [missionOpen, setMissionOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(false);

  useDashboardRealtime({ userId: profile.id });

  const pendingMission = missionEngine.dailyMissions.find((m) => m.status === "pending");

  const handleQuickAction = (action: QuickActionId) => {
    switch (action) {
      case "share_idea":
        setComposerExpanded(true);
        composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      case "find_collaborators":
        router.push("/community");
        break;
      case "start_project":
        setProjectOpen(true);
        break;
      case "join_community":
        setCommunityOpen(true);
        break;
      case "complete_mission":
        if (pendingMission) router.push(pendingMission.action_href);
        else setMissionOpen(true);
        break;
      case "help_someone":
        router.push("/community");
        break;
      case "learn_something":
        router.push(primaryRecommendation.actionHref);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <HomeHero profile={profile} onQuickAction={handleQuickAction} />

      <HomeImpactMetrics metrics={homeImpactMetrics} />

      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-6 xl:max-w-2xl">
          <div ref={composerRef}>
            <HomeComposer
              profile={profile}
              expanded={composerExpanded}
              onExpandedChange={setComposerExpanded}
            />
          </div>
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
