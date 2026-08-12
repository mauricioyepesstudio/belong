"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { Avatar } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import {
  Activity,
  Bot,
  CalendarDays,
  Compass,
  FolderKanban,
  Globe2,
  Orbit,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import styles from "./home-universe.module.css";

type UniverseProps = {
  data: HomeEngineData;
  onCreateProject: () => void;
  onJoinCommunity: () => void;
};

type UniverseNode = {
  label: string;
  href: string;
  value: string | number;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  position: string;
  tone: "violet" | "cyan" | "amber";
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function activityLabel(title: string, subtitle?: string) {
  if (title.trim().toLowerCase() !== "join") return title;
  return subtitle ? `Joined ${subtitle}` : "Joined a community";
}

function Panel({
  eyebrow,
  title,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 className="mt-1 text-sm font-semibold text-white">{title}</h2>
        </div>
        <span className={styles.panelIcon} aria-hidden>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function HomeUniverse({ data, onCreateProject, onJoinCommunity }: UniverseProps) {
  const firstName = data.profile.full_name?.split(" ")[0] ?? "Builder";
  const mission = data.missionEngine.lifeMission;
  const missionTitle = mission?.title ?? data.primaryMission?.title ?? "Define your north star";
  const missionProgress = clampPercent(
    data.missionEngine.lifeMissionProgress?.completionPercent ?? data.weeklyProgress
  );
  const latestActivity = data.recentActivity.slice(0, 3);
  const topOpportunity = data.opportunities[0];

  const nodes: UniverseNode[] = [
    { label: "People", href: "/community?tab=people", value: data.stats.connections, icon: UserRound, position: styles.nodePeople, tone: "cyan" },
    { label: "Communities", href: "/community", value: data.communities.length, icon: UsersRound, position: styles.nodeCommunities, tone: "violet" },
    { label: "Projects", href: "/projects", value: data.stats.projects, icon: FolderKanban, position: styles.nodeProjects, tone: "amber" },
    { label: "Events", href: "/events", value: data.upcomingEvents.length, icon: CalendarDays, position: styles.nodeEvents, tone: "cyan" },
    { label: "Opportunities", href: "/search", value: data.opportunities.length, icon: Sparkles, position: styles.nodeOpportunities, tone: "amber" },
    { label: "Resources", href: "/marketplace", value: "Explore", icon: Compass, position: styles.nodeResources, tone: "violet" },
  ];

  return (
    <div className={styles.universe}>
      <div className={styles.aurora} aria-hidden />
      <nav className={styles.worldNav} aria-label="World navigation">
        <Link href="/dashboard" aria-current="page">World</Link>
        <Link href="/community">Community</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/events">Events</Link>
        <Link href="/search">Explore</Link>
      </nav>
      <header className="relative z-10 flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
            <Orbit className="h-3.5 w-3.5" aria-hidden />
            Your world today
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{data.todaySummary}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onJoinCommunity} className={styles.secondaryButton}>
            Join a community
          </button>
          <button type="button" onClick={onCreateProject} className={styles.primaryButton}>
            <Sparkles className="h-4 w-4" aria-hidden /> Create
          </button>
        </div>
      </header>

      <div className="relative z-10 mt-6 grid gap-4 xl:grid-cols-[minmax(210px,0.75fr)_minmax(480px,1.7fr)_minmax(210px,0.75fr)]">
        <aside className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1" aria-label="Focus and activity">
          <Panel eyebrow="Today's focus" title={missionTitle} icon={Target}>
            <div className="flex items-end justify-between gap-3">
              <span className="text-3xl font-semibold tabular-nums text-white">{missionProgress}%</span>
              <span className="text-xs text-white/40">mission progress</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className={styles.progress} style={{ width: `${missionProgress}%` }} />
            </div>
            <Link href="/profile?tab=missions" className={styles.panelLink}>Open mission <span aria-hidden>→</span></Link>
          </Panel>

          <Panel eyebrow="Pulse" title="Recent activity" icon={Activity}>
            {latestActivity.length ? (
              <ul className="space-y-3">
                {latestActivity.map((item) => (
                  <li key={item.id} className="flex gap-2.5 text-xs leading-5 text-white/55">
                    <span className={styles.activityDot} aria-hidden />
                    <span className="line-clamp-2">{activityLabel(item.title, item.subtitle)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-5 text-white/45">Your pulse will appear as you connect, build, and contribute.</p>
            )}
            <Link href="/notifications" className={styles.panelLink}>View activity <span aria-hidden>→</span></Link>
          </Panel>
        </aside>

        <section className={styles.worldStage} aria-labelledby="belong-world-title">
          <div className={styles.stars} aria-hidden />
          <svg className={styles.connections} viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="world-line-violet" x1="0" x2="1">
                <stop offset="0" stopColor="#8b5cf6" stopOpacity="0" />
                <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.75" />
                <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M500 310 L155 125" />
            <path d="M500 310 L845 120" />
            <path d="M500 310 L130 390" />
            <path d="M500 310 L870 385" />
            <path d="M500 310 L295 545" />
            <path d="M500 310 L705 545" />
          </svg>
          <div className={styles.orbitOuter} aria-hidden />
          <div className={styles.orbitInner} aria-hidden />
          <div className={styles.coreGlow} aria-hidden />

          <div className={styles.identityCore}>
            <div className={styles.avatarRing}>
              <Avatar
                src={data.profile.avatar_url ?? undefined}
                fallback={formatInitials(data.profile.full_name)}
                size="lg"
                className="h-16 w-16 rounded-full"
              />
            </div>
            <h2 id="belong-world-title" className="mt-3 text-base font-semibold text-white">{firstName}&apos;s world</h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-violet-200/60">Connected by purpose</p>
          </div>

          {nodes.map(({ label, href, value, icon: Icon, position, tone }) => (
            <Link key={label} href={href} className={`${styles.node} ${position}`} data-tone={tone}>
              <span className={styles.nodeIcon}><Icon className="h-4 w-4" aria-hidden /></span>
              <span>
                <span className="block text-[11px] font-semibold text-white">{label}</span>
                <span className="block text-[9px] text-white/40">{value}</span>
              </span>
            </Link>
          ))}

          <div className={styles.stageCaption}>
            <Globe2 className="h-3.5 w-3.5" aria-hidden />
            Live ecosystem · {data.stats.connections + data.communities.length + data.stats.projects} active connections
          </div>
        </section>

        <aside className="grid content-start gap-4 md:grid-cols-3 xl:grid-cols-1" aria-label="AI, missions and impact">
          <Panel eyebrow="AI companion" title="Next best move" icon={Bot}>
            <p className="text-xs leading-5 text-white/55">
              {topOpportunity?.description ?? data.primaryRecommendation.description}
            </p>
            <Link href={topOpportunity?.actionHref ?? data.primaryRecommendation.actionHref} className={styles.panelLink}>
              Explore suggestion <span aria-hidden>→</span>
            </Link>
          </Panel>

          <Panel eyebrow="Missions" title="Weekly momentum" icon={Target}>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums text-white">{data.weeklyGoals.filter((goal) => goal.status === "completed").length}</span>
              <span className="text-xs text-white/40">of {data.weeklyGoals.length} complete</span>
            </div>
            <Link href="/profile?tab=missions" className={styles.panelLink}>See missions <span aria-hidden>→</span></Link>
          </Panel>

          <Panel eyebrow="Impact" title="This week's signal" icon={TrendingUp}>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums text-white">{data.impactScore.weeklyScore}</span>
              <span className="text-xs text-emerald-300/70">impact points</span>
            </div>
            <p className="mt-2 text-xs text-white/40">{data.impactScore.totalScore} total across your BELONG journey.</p>
            <Link href="/profile?tab=impact" className={styles.panelLink}>View impact <span aria-hidden>→</span></Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
