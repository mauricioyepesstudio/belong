"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { Avatar } from "@/systems/design-system";
import { formatInitials, formatGreeting } from "@/lib/format";
import { getBuildGoalOption } from "@/engines/mission/config";
import { selectCompactRecommendations } from "@/engines/belong/home/recommendations";
import { useReducedMotion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion/fade-in";
import {
  Bell,
  Bot,
  BookOpen,
  Box,
  CalendarDays,
  Building2,
  CheckCircle2,
  Circle,
  FolderKanban,
  Globe2,
  Orbit,
  Rocket,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentType, type FormEvent } from "react";
import styles from "./home-universe.module.css";

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ENERGY_RADIUS = 41;
const ENERGY_CIRCUMFERENCE = 2 * Math.PI * ENERGY_RADIUS;

type UniverseProps = {
  data: HomeEngineData;
  onJoinCommunity: () => void;
  onStartMission: () => void;
};

type UniverseNode = {
  label: string;
  href: string;
  value: string | number;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  position: string;
  tone: "violet" | "cyan" | "amber";
};

const RECOMMENDATION_ICON: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  people: UserPlus,
  projects: FolderKanban,
  communities: UsersRound,
  organizations: Building2,
  missions: Target,
};

// World hero artwork — approved floating-island composition, matches
// reference/belong-dashboard-reference.png. onError below still guards
// against the file ever going missing (falls back to an inert background).
const WORLD_ART_SRC = "/images/home-world.webp";

const STAR_FIELD = [
  { top: "12%", left: "22%", size: 2, delay: "-0.4s" },
  { top: "20%", left: "78%", size: 2, delay: "-1.6s" },
  { top: "34%", left: "10%", size: 1.5, delay: "-2.4s" },
  { top: "42%", left: "88%", size: 2, delay: "-0.9s" },
  { top: "62%", left: "16%", size: 1.5, delay: "-3s" },
  { top: "70%", left: "84%", size: 2, delay: "-1.1s" },
  { top: "82%", left: "34%", size: 1.5, delay: "-2s" },
  { top: "80%", left: "64%", size: 2, delay: "-0.6s" },
];

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function Panel({
  eyebrow,
  title,
  icon: Icon,
  children,
  id,
}: {
  eyebrow: string;
  title: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={`${styles.panel} scroll-mt-24`}>
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

export function HomeUniverse({
  data,
  onJoinCommunity,
  onStartMission,
}: UniverseProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [askQuery, setAskQuery] = useState("");
  const [worldArtMissing, setWorldArtMissing] = useState(false);
  const firstName = data.profile.full_name?.split(" ")[0] ?? "Builder";
  const mission = data.missionEngine.lifeMission;
  const missionTitle = mission?.title ?? data.primaryMission?.title ?? "Define your north star";
  const missionProgress = clampPercent(
    data.missionEngine.lifeMissionProgress?.completionPercent ?? data.weeklyProgress
  );
  const buildGoal = getBuildGoalOption(data.profile.build_goal);
  const journeyChapter = buildGoal?.label ?? "Discovery";

  const streakPercent = clampPercent((data.momentum.current_streak / 7) * 100);
  const energyScore = clampPercent(
    (missionProgress + data.weeklyProgress + streakPercent + clampPercent(data.impactEngine.progressToNext)) / 4
  );
  const energyTier =
    energyScore >= 70 ? "You're on fire this week!" : energyScore >= 35 ? "Building steady momentum." : "Every action adds energy.";

  const activeGoal = data.weeklyGoals.find((goal) => goal.status === "active");
  const openMilestone = mission?.milestones.find((m) => !m.completedAt);
  const nextMilestoneTitle = activeGoal?.title ?? openMilestone?.title ?? null;
  const nextMilestonePercent = activeGoal
    ? clampPercent((activeGoal.current_count / Math.max(1, activeGoal.target_count)) * 100)
    : openMilestone
      ? missionProgress
      : null;

  const activeProjectsCount = data.recentProjects.filter(
    (p) => p.status === "active" || p.status === "planning"
  ).length;

  const checklist = data.missionEngine.dailyMissions.slice(0, 4);
  const nextPendingMission = checklist.find((m) => m.status === "pending");

  const history = data.impactEngine.history.slice(-8);
  const storyPoints = (() => {
    if (history.length < 2) return null;
    const scores = history.map((h) => h.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const span = Math.max(1, max - min);
    const width = 300;
    const height = 56;
    return history.map((h, index) => {
      const x = (index / (history.length - 1)) * width;
      const y = height - 8 - ((h.score - min) / span) * (height - 16);
      return { x, y };
    });
  })();
  const storyPath = storyPoints
    ? storyPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
    : "";

  const companionRecommendations = selectCompactRecommendations(data.opportunityRecommendations, 3);

  const handleAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = askQuery.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Matches the approved reference composition: 7 nodes at a consistent orbit
  // radius around the central avatar. "Projects" is intentionally not part of
  // this orbit (see reference) — its data still surfaces via the "Right now"
  // panel and the stage caption below.
  const nodes: UniverseNode[] = [
    { label: "BELONG Platform", href: "/profile?tab=missions", value: `${missionProgress}%`, icon: Box, position: styles.nodePlatform, tone: "violet" },
    { label: "People", href: "/community?tab=people", value: data.stats.connections, icon: UserRound, position: styles.nodePeople, tone: "cyan" },
    { label: "Communities", href: "/community", value: data.communities.length, icon: UsersRound, position: styles.nodeCommunities, tone: "violet" },
    { label: "Opportunities", href: "/opportunities", value: data.opportunityRecommendations.projects.length + data.opportunityRecommendations.people.length + data.opportunityRecommendations.communities.length + data.opportunityRecommendations.missions.length, icon: Sparkles, position: styles.nodeOpportunities, tone: "amber" },
    { label: "Events", href: "/events", value: data.upcomingEvents.length, icon: CalendarDays, position: styles.nodeEvents, tone: "cyan" },
    { label: "Resources", href: "/marketplace", value: "Explore", icon: BookOpen, position: styles.nodeResources, tone: "violet" },
    { label: "AI Companion", href: "#ai-companion", value: "Insights", icon: Bot, position: styles.nodeCompanion, tone: "cyan" },
  ];

  return (
    <div className={styles.universe}>
      <div className={styles.aurora} aria-hidden />
      <div className={styles.dashboardGrid}>
        <aside className={`grid content-start gap-4 md:grid-cols-3 xl:grid-cols-1 ${styles.asideContext}`} aria-label="Your day and momentum">
          <Panel eyebrow={formatGreeting()} title={`${firstName} 👋`} icon={Orbit}>
            <p className="text-xs leading-5 text-white/55">
              You&apos;re in the {journeyChapter} chapter of your journey.
            </p>
            <Link href="/profile?tab=missions" className={styles.panelLink}>View my journey <span aria-hidden>→</span></Link>
          </Panel>

          <Panel eyebrow="The pulse" title="Right now" icon={TrendingUp}>
            <ul className={styles.pulseList}>
              <li className={styles.pulseRow}>
                <span className={styles.pulseIcon} aria-hidden><Rocket className="h-3.5 w-3.5" /></span>
                <span>
                  <span className={styles.pulseValue}>{activeProjectsCount}</span>{" "}
                  <span className={styles.pulseLabel}>active projects</span>
                </span>
              </li>
              <li className={styles.pulseRow}>
                <span className={styles.pulseIcon} aria-hidden><UserPlus className="h-3.5 w-3.5" /></span>
                <span>
                  <span className={styles.pulseValue}>{data.stats.pendingConnections}</span>{" "}
                  <span className={styles.pulseLabel}>connection requests</span>
                </span>
              </li>
              <li className={styles.pulseRow}>
                <span className={styles.pulseIcon} aria-hidden><Bell className="h-3.5 w-3.5" /></span>
                <span>
                  <span className={styles.pulseValue}>{data.recentNotifications.length}</span>{" "}
                  <span className={styles.pulseLabel}>new notifications</span>
                </span>
              </li>
              <li className={styles.pulseRow}>
                <span className={styles.pulseIcon} aria-hidden><CalendarDays className="h-3.5 w-3.5" /></span>
                <span>
                  <span className={styles.pulseValue}>{data.upcomingEvents.length}</span>{" "}
                  <span className={styles.pulseLabel}>events this week</span>
                </span>
              </li>
            </ul>
          </Panel>

          <Panel eyebrow="Your energy" title="Momentum score" icon={Sparkles}>
            <div className={styles.energyRingWrap}>
              <svg className={styles.energyRingSvg} viewBox="0 0 96 96" aria-hidden>
                <defs>
                  <linearGradient id="energy-ring-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <circle className={styles.energyRingTrack} cx="48" cy="48" r={ENERGY_RADIUS} />
                <circle
                  className={styles.energyRingFill}
                  cx="48"
                  cy="48"
                  r={ENERGY_RADIUS}
                  strokeDasharray={ENERGY_CIRCUMFERENCE}
                  strokeDashoffset={ENERGY_CIRCUMFERENCE - (ENERGY_CIRCUMFERENCE * energyScore) / 100}
                />
              </svg>
              <span className={styles.energyValue}>{energyScore}%</span>
            </div>
            <p className="mt-3 text-center text-xs text-white/55">{energyTier}</p>
            {nextMilestoneTitle && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>Next milestone</span>
                  <span>{nextMilestoneTitle}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className={styles.progress} style={{ width: `${nextMilestonePercent ?? 0}%` }} />
                </div>
              </div>
            )}
          </Panel>
        </aside>

        <section className={styles.worldStage} aria-labelledby="belong-world-title">
          <header className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>
              This is your world.
              <br />
              <span>Build it. Together.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              People, projects and opportunities
              <br className="hidden sm:block" /> connected to your purpose.
            </p>
          </header>

          <div className={styles.heroActions} aria-label="Build your world">
            <button type="button" onClick={onJoinCommunity} className={styles.primaryButton}>
              <UsersRound className="h-4 w-4" aria-hidden />
              Join BELONG
            </button>
            <button
              type="button"
              onClick={onStartMission}
              className={`${styles.secondaryButton} ${styles.missionButton}`}
            >
              <Rocket className="h-4 w-4" aria-hidden />
              Start Mission
            </button>
            <Link
              href="/people/discover"
              className={`${styles.secondaryButton} ${styles.peopleButton}`}
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Find People
            </Link>
          </div>

          {/* Layer 1 — world artwork. onError keeps a broken-image icon from
              ever showing if the asset is ever removed/renamed. */}
          <div className={styles.worldArt} aria-hidden>
            {!worldArtMissing && (
              <Image
                src={WORLD_ART_SRC}
                alt=""
                fill
                priority
                sizes="(min-width: 1280px) 900px, 100vw"
                style={{ objectFit: "cover", objectPosition: "center" }}
                onError={() => setWorldArtMissing(true)}
              />
            )}
          </div>

          {/* Layer 2 — atmospheric overlay (cool-to-warm mood wash) */}
          <div className={styles.nebulaViolet} aria-hidden />
          <div className={styles.nebulaAmber} aria-hidden />
          <div className={styles.horizon} aria-hidden />
          <div className={styles.vignette} aria-hidden />

          {/* Layer 3 — stars / particles */}
          <div className={styles.stars} aria-hidden />
          {STAR_FIELD.map((star, index) => (
            <span
              key={index}
              className={styles.twinkle}
              aria-hidden
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
              }}
            />
          ))}
          {/* Layer 4 — glow / fog (decorative orbit rings + core glow) */}
          <div className={styles.orbitOuter} aria-hidden />
          <div className={styles.orbitInner} aria-hidden />
          <div className={styles.coreGlow} aria-hidden />

          {/* Layer 5 — dynamic orbit connection lines, one per node, matching
              the tight consistent-radius layout below. Coordinates are
              node left/top percentages * 10 / * 6.2 (viewBox is 1000x620,
              i.e. 100% = 620 on the y axis) — the 4th path targets
              .nodeCompanion (left:56.3%, top:78.5% -> 563, 487); keep this
              in sync if that node's CSS position ever changes again. */}
          <svg className={styles.connections} viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="world-line-violet" x1="0" x2="1">
                <stop offset="0" stopColor="#8b5cf6" stopOpacity="0" />
                <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.75" />
                <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M500 310 L500 124" />
            <path d="M500 310 L795 203" />
            <path d="M500 310 L848 358" />
            <path d="M500 310 L563 487" />
            <path d="M500 310 L294 463" />
            <path d="M500 310 L152 358" />
            <path d="M500 310 L205 203" />
          </svg>

          {/* Layer 6 — central authenticated user avatar + progress ring.
              The ring is positioned at the true 50%/50% center of the stage
              independently of the caption text below it, so the avatar's
              visual center always matches the node/connection-line center
              regardless of how many lines of caption text render. */}
          <FadeIn direction="none" className={styles.identityCore}>
            <div className={styles.avatarRingWrap}>
              <div className={styles.pulseRingOuter} aria-hidden />
              <div className={styles.pulseRing} aria-hidden />
              <svg className={styles.progressRing} viewBox="0 0 96 96" aria-hidden>
                <defs>
                  <linearGradient id="core-progress-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <circle className={styles.progressRingTrack} cx="48" cy="48" r={RING_RADIUS} />
                <circle
                  className={styles.progressRingFill}
                  cx="48"
                  cy="48"
                  r={RING_RADIUS}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * missionProgress) / 100}
                />
              </svg>
              <div className={styles.avatarRing}>
                <Avatar
                  src={data.profile.avatar_url ?? undefined}
                  fallback={formatInitials(data.profile.full_name)}
                  size="lg"
                  className="h-16 w-16 rounded-full sm:h-24 sm:w-24"
                />
              </div>
            </div>
            <span className="sr-only">Platform progress: {missionProgress}% toward {missionTitle}</span>
            <div className={styles.identityCaption}>
              <span className={styles.youBadge}>You</span>
              <h2 id="belong-world-title" className="mt-2 text-base font-semibold text-white">{firstName}&apos;s world</h2>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-violet-200/60">Connected by purpose</p>
            </div>
          </FadeIn>

          {/* Layer 7 — orbit nodes, above the artwork/atmosphere layers */}
          <StaggerList className={styles.nodesLayer} stagger={0.07} reveal={reducedMotion ? false : true}>
            {nodes.map(({ label, href, value, icon: Icon, position, tone }) => (
              <StaggerItem key={label} className={position}>
                <Link href={href} className={styles.node} data-tone={tone}>
                  <span className={styles.nodeIcon}><Icon className="h-5 w-5" aria-hidden /></span>
                  <span className={styles.nodeLabel}>{label}</span>
                  <span className={styles.nodeValue}>{value}</span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerList>

        </section>

        <aside className={`grid content-start gap-4 md:grid-cols-3 xl:grid-cols-1 ${styles.asideCompanion}`} aria-label="Focus, story and AI companion">
          <Panel eyebrow="Today's focus" title={missionTitle} icon={Target}>
            {checklist.length > 0 ? (
              <ul className={styles.checklist}>
                {checklist.map((item) => (
                  <li key={item.id} className={styles.checkRow} data-done={item.status === "completed"}>
                    <span className={styles.checkDot} aria-hidden>
                      {item.status === "completed" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </span>
                    <span className="line-clamp-1">{item.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-5 text-white/45">No missions queued yet — start one to see your checklist here.</p>
            )}
            <Link href={nextPendingMission?.action_href ?? "/profile?tab=missions"} className={styles.panelLink}>
              Continue focus <span aria-hidden>→</span>
            </Link>
          </Panel>

          <Panel eyebrow="Daily story" title="Beta" icon={Rocket}>
            {storyPoints ? (
              <svg className={styles.storyLine} viewBox="0 0 300 56" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="story-line-gradient" x1="0" x2="1">
                    <stop offset="0" stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <path className={styles.storyPath} d={storyPath} />
                {storyPoints.map((p, i) => (
                  <circle key={i} className={styles.storyDot} cx={p.x} cy={p.y} r={2.2} />
                ))}
              </svg>
            ) : (
              <p className="text-xs leading-5 text-white/45">Your impact story will take shape as you build.</p>
            )}
            <p className="mt-3 text-xs leading-5 text-white/55">
              You&apos;ve connected with {data.stats.connections} {data.stats.connections === 1 ? "person" : "people"} and
              joined {data.communities.length} {data.communities.length === 1 ? "community" : "communities"} on BELONG.
            </p>
            <Link href="/profile?tab=impact" className={styles.panelLink}>See my full story <span aria-hidden>→</span></Link>
          </Panel>

          <Panel eyebrow="AI companion" title="Next best move" icon={Bot} id="ai-companion">
            <p className="text-xs leading-5 text-white/55">Hey {firstName}! Here&apos;s what I found for you:</p>
            {companionRecommendations.length > 0 ? (
              <div className={`${styles.aiList} mt-3`}>
                {companionRecommendations.map((item) => {
                  const Icon = RECOMMENDATION_ICON[item.category] ?? Sparkles;
                  return (
                    <Link key={`${item.category}-${item.id}`} href={item.meta?.actionHref ?? item.href} className={styles.aiRow}>
                      <span className={styles.aiIcon} aria-hidden><Icon className="h-3.5 w-3.5" /></span>
                      <span className="min-w-0 flex-1 truncate text-xs text-white/75">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-white/45">{data.primaryRecommendation.description}</p>
            )}
            <form onSubmit={handleAsk} className="mt-3">
              <label htmlFor="ai-ask-input" className="sr-only">Ask me anything</label>
              <div className="flex items-center gap-2">
                <input
                  id="ai-ask-input"
                  type="text"
                  value={askQuery}
                  onChange={(event) => setAskQuery(event.target.value)}
                  placeholder="Ask me anything…"
                  className={styles.askInput}
                />
                <button type="submit" className={styles.panelIcon} aria-label="Send">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </Panel>
        </aside>

        <div className={styles.ecosystemStatus}>
          <span className={styles.liveDot} aria-hidden />
          <Globe2 className="h-3.5 w-3.5" aria-hidden />
          Live ecosystem · {data.stats.connections + data.communities.length + data.stats.projects} active connections
        </div>
      </div>
    </div>
  );
}
