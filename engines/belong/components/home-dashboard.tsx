"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import type { UserActivityItem } from "@/engines/belong/global-feed";
import type { ImpactEvent, ReputationProfile } from "@/engines/identity/reputation";
import { MODULE_LABELS } from "@/engines/identity/reputation";
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
import { ConnectionStatus, LiveBadge, useDashboardRealtime } from "@/engines/core/realtime";

function impactModuleToActivityType(
  module: ImpactEvent["module"]
): UserActivityItem["type"] {
  switch (module) {
    case "mission":
      return "mission";
    case "project":
      return "project";
    case "community":
      return "community";
    default:
      return "achievement";
  }
}

function impactEventToActivity(event: ImpactEvent): UserActivityItem {
  return {
    id: event.id,
    type: impactModuleToActivityType(event.module),
    title: event.eventType.replace(/_/g, " "),
    subtitle: MODULE_LABELS[event.module],
    points: event.points,
    href: "/profile",
    createdAt: event.createdAt,
  };
}

function applyImpactEvent(reputation: ReputationProfile, event: ImpactEvent): ReputationProfile {
  const moduleTotal = reputation.eventTotals.find((t) => t.module === event.module);
  const nextTotals = moduleTotal
    ? reputation.eventTotals.map((t) =>
        t.module === event.module
          ? { ...t, points: t.points + event.points, count: t.count + 1 }
          : t
      )
    : [
        ...reputation.eventTotals,
        { module: event.module, points: event.points, count: 1 },
      ];

  return {
    ...reputation,
    totalImpact: reputation.totalImpact + event.points,
    recentEvents: [event, ...reputation.recentEvents].slice(0, 12),
    eventTotals: nextTotals,
    scores: {
      ...reputation.scores,
      reputationScore: reputation.scores.reputationScore + event.points,
    },
  };
}

export function HomeDashboard(data: HomeEngineData) {
  const {
    profile,
    stats,
    impactEngine: initialImpactEngine,
    missionEngine,
    communities,
    discoverCommunities,
    recentProjects: initialProjects,
    weeklyGoals,
    weeklyProgress,
    momentum,
    recentActivity: initialActivity,
    timeline,
    smartHome,
    crossModuleLinks,
    primaryRecommendation,
    reputation: initialReputation,
  } = data;

  const [missionOpen, setMissionOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [impactScore, setImpactScore] = useState(initialImpactEngine.score.score ?? 0);
  const [reputation, setReputation] = useState(initialReputation);
  const [recentActivity, setRecentActivity] = useState(initialActivity);
  const [recentProjects, setRecentProjects] = useState(initialProjects);
  const [impactEngine, setImpactEngine] = useState(initialImpactEngine);

  useDashboardRealtime({
    userId: profile.id,
    onImpactInsert: (event) => {
      setImpactScore((score) => score + event.points);
      setReputation((prev) => applyImpactEvent(prev, event));
      setRecentActivity((prev) => [impactEventToActivity(event), ...prev].slice(0, 20));
      setImpactEngine((prev) => ({
        ...prev,
        score: {
          ...prev.score,
          score: (prev.score.score ?? 0) + event.points,
        },
        weeklyImpact: {
          ...prev.weeklyImpact,
          points: prev.weeklyImpact.points + event.points,
        },
      }));
    },
    onMissionUpdate: (row) => {
      if (row.state === "completed") {
        setRecentActivity((prev) =>
          [
            {
              id: `mission-${row.id}-${Date.now()}`,
              type: "mission" as const,
              title: String(row.title ?? "Mission completed"),
              subtitle: "Life mission progress",
              href: `/missions/${row.id}`,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 20)
        );
      }
    },
    onProjectUpdate: (row) => {
      const projectId = String(row.id);
      setRecentProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? {
                ...project,
                progress: Number(row.progress ?? project.progress),
                status: (row.status as typeof project.status) ?? project.status,
              }
            : project
        )
      );
    },
  });

  const scrollToMissions = () => {
    document.getElementById("missions")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToLifeMission = () => {
    document.getElementById("life-mission")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-16 pb-8 md:space-y-20">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <LiveBadge label="Live dashboard" />
        <ConnectionStatus />
      </div>

      <ProfileHeader profile={profile} stats={stats} impactScore={impactScore} />

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
