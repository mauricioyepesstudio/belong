"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { useDashboardRealtime } from "@/engines/core/realtime";
import { Modal } from "@/components/ui/modal";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeComposer } from "./home-composer";
import { HomeFocusWelcome } from "./home-focus-welcome";
import { HomeRecommendations } from "./home-recommendations";
import { HomeContinue } from "./home-continue";
import { HomeQuickActions, type QuickActionId } from "./home-quick-actions";
import { HomeRecentActivity } from "./home-recent-activity";
import { HomeTrendingCommunities } from "./home-trending-communities";
import { HomeWeeklyImpact } from "./home-weekly-impact";
import { DashboardActions } from "../dashboard/dashboard-actions";

export function HomeScreen(data: HomeEngineData) {
  const router = useRouter();
  const composerRef = useRef<HTMLDivElement>(null);
  const {
    profile,
    communities,
    discoverCommunities,
    recentProjects,
    recentActivity,
    upcomingEvents,
    recentConversations,
    todaySummary,
  } = data;

  const [projectOpen, setProjectOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  useDashboardRealtime({ userId: profile.id });

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
        router.push("/community?tab=people");
        break;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <HomeFocusWelcome profile={profile} summary={todaySummary} />

      <HomeWeeklyImpact impact={data.impactScore} />

      <HomeRecommendations recommendations={data.opportunityRecommendations} compact />

      <HomeContinue
        projects={recentProjects}
        conversations={recentConversations}
        events={upcomingEvents}
        onResumeDraft={() => setComposerOpen(true)}
      />

      <HomeQuickActions onAction={handleQuickAction} />

      <HomeRecentActivity activities={recentActivity} />

      <HomeTrendingCommunities communities={discoverCommunities} />

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
        missionOpen={false}
        onMissionOpenChange={() => {}}
        projectOpen={projectOpen}
        onProjectOpenChange={setProjectOpen}
        communityOpen={communityOpen}
        onCommunityOpenChange={setCommunityOpen}
        showButtons={false}
      />
    </div>
  );
}
