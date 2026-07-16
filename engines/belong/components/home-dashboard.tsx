"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { useState } from "react";
import { ProfileHeader } from "./dashboard/welcome-hero";
import { ImpactScore } from "./dashboard/personal-impact";
import { ActiveMissions } from "./dashboard/active-missions";
import { ProjectsRow } from "./dashboard/projects-row";
import { CommunitiesRow } from "./dashboard/communities-row";
import { WeeklyGoal } from "./dashboard/weekly-goal";
import { RecentActivity } from "./dashboard/global-impact";
import { DashboardActions } from "./dashboard/dashboard-actions";

export function HomeDashboard(data: HomeEngineData) {
  const {
    profile,
    impactEngine,
    missionEngine,
    communities,
    discoverCommunities,
    recentProjects,
    recentActivity,
  } = data;

  const [missionOpen, setMissionOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-16 pb-8 md:space-y-20">
      <ProfileHeader profile={profile} />

      <DashboardActions
        discoverCommunities={discoverCommunities}
        missionOpen={missionOpen}
        onMissionOpenChange={setMissionOpen}
        projectOpen={projectOpen}
        onProjectOpenChange={setProjectOpen}
        communityOpen={communityOpen}
        onCommunityOpenChange={setCommunityOpen}
      />

      <ImpactScore impactEngine={impactEngine} />

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

      <WeeklyGoal
        weeklyGoals={missionEngine.weeklyGoals}
        weeklyProgress={missionEngine.weeklyProgress}
      />

      <RecentActivity
        activity={recentActivity}
        onExploreCommunities={() => setCommunityOpen(true)}
      />
    </div>
  );
}
