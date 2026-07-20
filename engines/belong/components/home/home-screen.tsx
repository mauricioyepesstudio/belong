"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { useDashboardRealtime } from "@/engines/core/realtime";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeComposer } from "./home-composer";
import { HomeTimeline } from "./home-timeline";
import { DiscoveryPanel } from "./discovery-panel";
import { HomeWelcome } from "./home-welcome";
import { HomePrimaryActions, type PrimaryActionId } from "./home-primary-actions";
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
    missionEngine,
  } = data;

  const [missionOpen, setMissionOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(false);

  const isNewUser = communities.length === 0;
  const pendingMission = missionEngine.dailyMissions.find((m) => m.status === "pending");

  useDashboardRealtime({ userId: profile.id });

  const handlePrimaryAction = (action: PrimaryActionId) => {
    switch (action) {
      case "share_idea":
        setComposerExpanded(true);
        composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      case "join_community":
        setCommunityOpen(true);
        break;
      case "create_community":
        router.push("/community");
        break;
      case "start_project":
        setProjectOpen(true);
        break;
      case "complete_mission":
        if (pendingMission) router.push(pendingMission.action_href);
        else setMissionOpen(true);
        break;
    }
  };

  return (
    <div className="space-y-10 md:space-y-12">
      <HomeWelcome profile={profile} />

      <HomePrimaryActions isNewUser={isNewUser} onAction={handlePrimaryAction} />

      <HomeImpactMetrics metrics={homeImpactMetrics} />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start xl:gap-8">
        <div className="min-w-0 space-y-10">
          <div ref={composerRef}>
            <HomeComposer
              profile={profile}
              communities={communities}
              expanded={composerExpanded}
              onExpandedChange={setComposerExpanded}
              onNeedCommunity={() => setCommunityOpen(true)}
            />
          </div>
          <HomeTimeline
            activities={homeTimeline}
            hasCommunities={communities.length > 0}
            onExplore={() => setCommunityOpen(true)}
            onCreateCommunity={() => router.push("/community")}
          />
        </div>

        <DiscoveryPanel discovery={homeDiscovery} />
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
        showButtons={false}
      />
    </div>
  );
}
