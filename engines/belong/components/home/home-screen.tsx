"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { applyImpactScoreInsert } from "@/engines/impact";
import { useDashboardRealtime } from "@/engines/core/realtime";
import { Modal } from "@/components/ui/modal";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HomeComposer } from "./home-composer";
import { DashboardActions } from "../dashboard/dashboard-actions";
import { HomeUniverse } from "./home-universe";
import { HomeSuggestionsCarousel } from "./home-suggestions-carousel";
import { HomeLiveBuilders } from "./home-live-builders";
import { HomeMissionsRow } from "./home-missions-row";
import { HomeImpactRipple } from "./home-impact-ripple";
import { HomeSpotlight } from "./home-spotlight";

export function HomeScreen(data: HomeEngineData) {
  const searchParams = useSearchParams();
  const composerRef = useRef<HTMLDivElement>(null);
  const { profile, communities, discoverCommunities, recentProjects } = data;

  const [projectOpen, setProjectOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(() => searchParams.get("build") === "open");
  const [impactScore, setImpactScore] = useState(data.impactScore);

  useDashboardRealtime({
    userId: profile.id,
    onImpactInsert: (event) => {
      setImpactScore((prev) => applyImpactScoreInsert(prev, event));
    },
  });

  const achievementActivity = data.homeTimeline.find((item) => item.type === "achievement") ?? null;
  const latestImpactActivity = achievementActivity ?? data.homeTimeline[0] ?? null;
  const topContributor = data.homeDiscovery.topContributors[0] ?? null;

  return (
    <div className="pb-8">
      <div className="space-y-5">
        <HomeUniverse
          data={{ ...data, impactScore }}
          onJoinCommunity={() => setCommunityOpen(true)}
          onStartMission={() => setMissionOpen(true)}
        />

        <HomeSuggestionsCarousel people={data.suggestedPeople} />

        <HomeLiveBuilders activities={data.homeTimeline} />
      </div>

      <div className="mt-8 space-y-8">
        <HomeMissionsRow goals={data.weeklyGoals} onCreateMission={() => setMissionOpen(true)} />

        <HomeImpactRipple impactEngine={data.impactEngine} latestImpact={latestImpactActivity} profile={profile} />

        <HomeSpotlight
          topContributor={topContributor}
          project={recentProjects[0] ?? null}
          community={discoverCommunities[0] ?? null}
          impactHighlight={achievementActivity}
          metrics={data.homeImpactMetrics}
        />
      </div>

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="Create post"
        description="Share an update with your community"
        size="xl"
      >
        <div ref={composerRef}>
          <HomeComposer
            profile={profile}
            communities={communities}
            expanded
            hideHeader
            onNeedCommunity={() => {
              setComposerOpen(false);
              setCommunityOpen(true);
            }}
          />
        </div>
      </Modal>

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
