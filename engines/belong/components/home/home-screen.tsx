"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import type { SocialPublishingContext } from "@/engines/social";
import { applyImpactScoreInsert } from "@/engines/impact";
import { useDashboardRealtime } from "@/engines/core/realtime";
import { Modal } from "@/components/ui/modal";
import { SocialComposer } from "@/components/features/social/social-composer";
import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardActions } from "../dashboard/dashboard-actions";
import { CreateProofModal } from "../dashboard/create-proof-modal";
import { UpgradePrompt } from "@/engines/billing";
import { HomeMobileCompanionPanels, HomeUniverse } from "./home-universe";
import { HomeSuggestionsCarousel } from "./home-suggestions-carousel";
import { HomeLiveBuilders } from "./home-live-builders";
import { HomeSocialPreview } from "./home-social-preview";
import { HomeMissionsRow } from "./home-missions-row";
import { HomeImpactRipple } from "./home-impact-ripple";
import { HomeSpotlight } from "./home-spotlight";
import { HomeQuickActions, type QuickActionId } from "./home-quick-actions";

export function HomeScreen(data: HomeEngineData) {
  const router = useRouter();
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

  const handleQuickAction = (action: QuickActionId) => {
    switch (action) {
      case "create_post":
        setComposerOpen(true);
        break;
      case "create_project":
        setProjectOpen(true);
        break;
      case "join_community":
        setCommunityOpen(true);
        break;
      case "invite":
        router.push("/people/discover");
        break;
    }
  };

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
        <UpgradePrompt tier={profile.subscription_tier} />

        <HomeQuickActions onAction={handleQuickAction} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-body font-medium text-fg-primary">Prove it</p>
            <p className="text-caption text-fg-faint">
              Turn a claim, goal, or commitment into something evidence can resolve.
            </p>
          </div>
          <CreateProofModal communities={communities} />
        </div>

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
