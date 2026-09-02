"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import type { SocialPublishingContext } from "@/engines/social";
import { applyImpactScoreInsert } from "@/engines/impact";
import { useDashboardRealtime } from "@/engines/core/realtime";
import { Modal } from "@/components/ui/modal";
import { SocialComposer } from "@/components/features/social/social-composer";
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardActions } from "../dashboard/dashboard-actions";
import { HomeMobileCompanionPanels, HomeUniverse } from "./home-universe";
import { HomeSuggestionsCarousel } from "./home-suggestions-carousel";
import { HomeLiveBuilders } from "./home-live-builders";
import { HomeSocialPreview } from "./home-social-preview";
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

  // Post destination options for the composer, built from data already on
  // the page (the same communities/projects the rest of Home renders) —
  // avoids a second server round-trip just to list them.
  const publishingContexts = useMemo<SocialPublishingContext[]>(
    () => [
      ...communities.map((community) => ({ type: "community" as const, id: community.id, name: community.name })),
      ...recentProjects.map((project) => ({ type: "project" as const, id: project.id, name: project.name })),
    ],
    [communities, recentProjects]
  );

  return (
    <div className="pb-8">
      <div className="space-y-5">
        <HomeUniverse
          data={{ ...data, impactScore }}
          onPostUpdate={() => setComposerOpen(true)}
          onStartMission={() => setMissionOpen(true)}
        />

        <HomeSuggestionsCarousel people={data.suggestedPeople} />

        <HomeLiveBuilders activities={data.homeTimeline} />

        <HomeSocialPreview />

        <HomeMobileCompanionPanels data={{ ...data, impactScore }} />
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
        title="Post an update"
        description="What's happening in your world?"
        size="xl"
      >
        <div ref={composerRef}>
          <SocialComposer
            viewer={{ id: profile.id, fullName: profile.full_name, avatarUrl: profile.avatar_url }}
            contexts={publishingContexts}
            onPublished={() => setComposerOpen(false)}
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
