"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { useState } from "react";
import { ProfileHeader } from "./dashboard/welcome-hero";
import { ImpactScore } from "./dashboard/personal-impact";
import { ReputationSummary } from "@/engines/identity/components/reputation-dashboard";
import { ActiveMissions } from "./dashboard/active-missions";
import { ProjectsRow } from "./dashboard/projects-row";
import { CommunitiesRow } from "./dashboard/communities-row";
import { WeeklyGoal } from "./dashboard/weekly-goal";
import { DashboardActions } from "./dashboard/dashboard-actions";
import { SmartHome } from "./dashboard/smart-home";
import { DashboardTimeline } from "./dashboard/dashboard-timeline";
import { CrossModuleNav } from "./dashboard/cross-module-nav";
import { UnifiedFeed } from "./dashboard/unified-feed";
import { QuarterlyGoalsSection } from "@/engines/mission/components/quarterly-goals-section";
import { LifeMissionPanel } from "@/engines/mission/components/life-mission-panel";
import { ScrollReveal } from "@/components/motion/fade-in";
import { GlassCard, SectionHeader } from "./dashboard/primitives";

export function HomeDashboard(data: HomeEngineData) {
  const {
    profile,
    stats,
    impactEngine,
    missionEngine,
    communities,
    discoverCommunities,
    recentProjects,
    weeklyGoals,
    weeklyProgress,
    momentum,
    recentActivity,
    timeline,
    smartHome,
    crossModuleLinks,
    primaryRecommendation,
    reputation,
  } = data;

  const [missionOpen, setMissionOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);

  const scrollToMissions = () => {
    document.getElementById("missions")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToLifeMission = () => {
    document.getElementById("life-mission")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-16 pb-8 md:space-y-20">
      <ProfileHeader
        profile={profile}
        stats={stats}
        impactScore={impactEngine.score.score}
      />

      <SmartHome recommendation={primaryRecommendation} items={smartHome} />

      <CrossModuleNav links={crossModuleLinks} />

      <DashboardTimeline timeline={timeline} />

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

      <ReputationSummary reputation={reputation} />

      <ImpactScore impactEngine={impactEngine} reputation={reputation} />

      <div id="life-mission">
        <ScrollReveal>
          <section>
            <SectionHeader label="Mission Engine" title="Life mission" />
            <GlassCard className="p-6 md:p-8">
              <LifeMissionPanel
                profile={profile}
                lifeMission={missionEngine.lifeMission}
                progress={missionEngine.lifeMissionProgress}
              />
            </GlassCard>
          </section>
        </ScrollReveal>
      </div>

      <QuarterlyGoalsSection
        goals={missionEngine.quarterlyGoals}
        quarterlyProgress={missionEngine.quarterlyProgress}
        hasLifeMission={Boolean(missionEngine.lifeMission)}
        onDefineMission={scrollToLifeMission}
      />

      <div id="missions">
        <ActiveMissions
          missionEngine={missionEngine}
          onNewMission={() => setMissionOpen(true)}
        />
      </div>

      <ProjectsRow
        projects={recentProjects}
        currentUserId={profile.id}
        onNewProject={() => setProjectOpen(true)}
      />

      <CommunitiesRow
        communities={communities}
        onJoinCommunity={() => setCommunityOpen(true)}
      />

      <div id="weekly-goals">
        <WeeklyGoal
          weeklyGoals={weeklyGoals}
          weeklyProgress={weeklyProgress}
          momentum={momentum}
          onViewMissions={scrollToMissions}
        />
      </div>

      <UnifiedFeed
        activity={recentActivity}
        onExploreCommunities={() => setCommunityOpen(true)}
      />
    </div>
  );
}
