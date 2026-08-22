"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import type { DiscoveryPerson } from "@/engines/opportunity";
import type { UserConnectionState } from "@/lib/core/connection-state";
import { sendConnectionRequest, startConversation } from "@/lib/actions/connections";
import { playTone } from "@/lib/sound";
import { Avatar, Button, useToast } from "@/systems/design-system";
import { formatInitials, formatGreeting } from "@/lib/format";
import { getBuildGoalOption } from "@/engines/mission/config";
import { selectCompactRecommendations } from "@/engines/belong/home/recommendations";
import { useReducedMotion } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { PeopleStoryDeck } from "@/components/features/discovery/story-deck/PeopleStoryDeck";
import { PeopleStoryCompact } from "@/components/features/discovery/story-deck/PeopleStoryCompact";
import {
  Bell,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  Globe2,
  MessageSquare,
  Orbit,
  PenSquare,
  Plus,
  Rocket,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ComponentType, type FormEvent } from "react";
import styles from "./home-universe.module.css";

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ENERGY_RADIUS = 41;
const ENERGY_CIRCUMFERENCE = 2 * Math.PI * ENERGY_RADIUS;

type UniverseProps = {
  data: HomeEngineData;
  onPostUpdate: () => void;
  onStartMission: () => void;
};

const RECOMMENDATION_ICON: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  people: UserPlus,
  projects: FolderKanban,
  communities: UsersRound,
  organizations: Building2,
  missions: Target,
};

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

const MEMBER_NODE_BASE_ANGLES = [18, 90, 162, 234, 306];

function hashPersonId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function memberNodePosition(personId: string, index: number) {
  const hash = hashPersonId(personId);
  const baseAngle = MEMBER_NODE_BASE_ANGLES[index % MEMBER_NODE_BASE_ANGLES.length];
  const angleJitter = (hash % 21) - 10;
  const angleRad = ((baseAngle + angleJitter - 90) * Math.PI) / 180;
  const radiusX = 32 + ((hash >> 5) % 7) - 3;
  const radiusY = 25 + ((hash >> 9) % 7) - 3;
  return {
    leftPct: clampPercent(50 + radiusX * Math.cos(angleRad)),
    topPct: clampPercent(50 + radiusY * Math.sin(angleRad)),
  };
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
  onPostUpdate,
  onStartMission,
}: UniverseProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { toast } = useToast();
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [pulsingPersonId, setPulsingPersonId] = useState<string | null>(null);
  const [connectionOverrides, setConnectionOverrides] = useState<Map<string, UserConnectionState>>(new Map());
  const [isConnectPending, startConnectTransition] = useTransition();
  const [askQuery, setAskQuery] = useState("");
  const [worldArtMissing, setWorldArtMissing] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);

  useEffect(() => {
    if (!activePersonId) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePersonId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activePersonId]);
  
  const firstName = data.profile.full_name?.split(" ")[0] ?? "Builder";
  const mission = data.missionEngine.lifeMission;
  const missionTitle = mission?.title ?? data.primaryMission?.title ?? "Define your north star";
  const missionProgress = clampPercent(
    data.missionEngine.lifeMissionProgress?.completionPercent ?? data.weeklyProgress
  );
  const buildGoal = getBuildGoalOption(data.profile.build_goal);
  const journeyChapter = buildGoal?.label ?? "Discovery";
  const greeting = formatGreeting();
  const mobileGreeting =
    greeting === "Good morning" ? "Buenos días" : greeting === "Good afternoon" ? "Buenas tardes" : "Buenas noches";

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

  const memberNodes = data.suggestedPeople.slice(0, 5).map((person, index) => ({
    person,
    ...memberNodePosition(person.id, index),
  }));
  const activePerson = memberNodes.find((n) => n.person.id === activePersonId)?.person ?? null;

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
              <span className={styles.desktopOnly}>
                This is your world.
                <br />
                <span>Build it. Together.</span>
              </span>
              <span className={styles.mobileOnly}>
                Este es tu mundo.
                <br />
                <span>Constrúyelo. Juntos.</span>
              </span>
            </h1>
            <p className={styles.heroSubtitle}>
              <span className={styles.desktopOnly}>
                People, projects and opportunities
                <br className="hidden sm:block" /> connected to your purpose.
              </span>
              <span className={styles.mobileOnly}>
                People, projects, and opportunities connected to your purpose.
              </span>
            </p>
          </header>

          <div className={styles.heroActions} aria-label="Build your world">
            <button type="button" onClick={onPostUpdate} className={styles.primaryButton}>
              <PenSquare className="h-4 w-4" aria-hidden />
              <span className={styles.desktopOnly}>Post an update</span>
              <span className={styles.mobileOnly}>Post an update</span>
            </button>
            <button
              type="button"
              onClick={onStartMission}
              className={`${styles.secondaryButton} ${styles.missionButton}`}
            >
              <Rocket className="h-4 w-4" aria-hidden />
              <span className={styles.desktopOnly}>Start Mission</span>
              <span className={styles.mobileOnly}>Start mission</span>
            </button>
            <Link
              href="/people/discover"
              className={`${styles.secondaryButton} ${styles.peopleButton}`}
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              <span className={styles.desktopOnly}>Find People</span>
              <span className={styles.mobileOnly}>Discover people</span>
            </Link>
          </div>

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

          <div className={styles.nebulaViolet} aria-hidden />
          <div className={styles.nebulaAmber} aria-hidden />
          <div className={styles.horizon} aria-hidden />
          <div className={styles.vignette} aria-hidden />

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
          <div className={styles.orbitOuter} aria-hidden />
          <div className={styles.orbitInner} aria-hidden />
          <div className={styles.coreGlow} aria-hidden />

          <svg className={styles.connections} viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="world-line-violet" x1="0" x2="1">
                <stop offset="0" stopColor="#8b5cf6" stopOpacity="0" />
                <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.75" />
                <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            {memberNodes.map(({ person, leftPct, topPct }) => (
              <path
                key={person.id}
                className={
                  person.connectionState.state === "connected"
                    ? styles.connectionConnected
                    : person.connectionState.state.startsWith("pending")
                      ? styles.connectionPending
                      : styles.connectionRecommended
                }
                d={`M500 310 L${(leftPct * 10).toFixed(1)} ${(topPct * 6.2).toFixed(1)}`}
              />
            ))}
          </svg>

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
              <h2 id="belong-world-title" className="mt-2 text-base font-semibold text-white">
                <span className={styles.desktopOnly}>{firstName}&apos;s world</span>
                <span className={styles.mobileOnly}>{firstName.toUpperCase()}&apos;S WORLD</span>
              </h2>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-violet-200/60">
                <span className={styles.desktopOnly}>Connected by purpose</span>
                <span className={styles.mobileOnly}>Connected by purpose</span>
              </p>
            </div>
          </FadeIn>

          <StaggerList className={styles.nodesLayer} stagger={0.07} reveal={reducedMotion ? false : true}>
            {memberNodes.map(({ person, leftPct, topPct }) => {
              const firstNameOnly = person.fullName?.split(" ")[0] ?? "Builder";
              const relationship = connectionOverrides.get(person.id) ?? person.connectionState;
              return (
                <div
                  key={person.id}
                  className={styles.memberNode}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                >
                  <StaggerItem>
                    <button
                      type="button"
                      className={`${styles.memberNodeButton} ${
                        relationship.state === "connected"
                          ? styles.memberNodeConnected
                          : relationship.state.startsWith("pending")
                            ? styles.memberNodePending
                            : styles.memberNodeRecommended
                      }`}
                      onClick={() => setActivePersonId((current) => (current === person.id ? null : person.id))}
                      aria-haspopup="dialog"
                      aria-expanded={activePersonId === person.id}
                      aria-label={`${person.fullName} — ${relationship.state === "connected" ? "connected" : relationship.state.startsWith("pending") ? "request pending" : "recommended for you"}`}
                    >
                      <span
                        className={`${styles.memberNodeAvatarWrap} ${pulsingPersonId === person.id ? styles.memberNodePulse : ""}`}
                      >
                        <span className={styles.memberNodeGlow} aria-hidden />
                        <Avatar
                          src={person.avatarUrl ?? undefined}
                          fallback={formatInitials(person.fullName)}
                          size="md"
                          className="h-11 w-11 rounded-full sm:h-14 sm:w-14"
                        />
                      </span>
                      <span className={styles.memberNodeName}>{firstNameOnly}</span>
                    </button>
                  </StaggerItem>
                </div>
              );
            })}
          </StaggerList>
          {activePerson && (
            <>
              <div
                className={styles.memberPopoverBackdrop}
                onClick={() => setActivePersonId(null)}
                aria-hidden
              />
              <div
                className={styles.memberPopover}
                role="dialog"
                aria-modal="true"
              >
                <PeopleStoryCompact
                  person={activePerson}
                  onOpenDeck={() => {
                    setDeckOpen(true);
                    setActivePersonId(null);
                  }}
                />
              </div>
            </>
          )}

          {deckOpen && (
            <PeopleStoryDeck
              people={data.suggestedPeople}
              onClose={() => setDeckOpen(false)}
            />
          )}
        </section>

        <div className={styles.mobileHeroActions} aria-label="Build your world">
          <button type="button" onClick={onPostUpdate} className={styles.primaryButton}>
            <PenSquare className="h-4 w-4" aria-hidden />
            Post an update
          </button>
          <button
            type="button"
            onClick={onStartMission}
            className={`${styles.secondaryButton} ${styles.missionButton}`}
          >
            <Rocket className="h-4 w-4" aria-hidden />
            Start mission
          </button>
          <Link href="/people/discover" className={`${styles.secondaryButton} ${styles.peopleButton}`}>
            <UserPlus className="h-4 w-4" aria-hidden />
            Discover people
          </Link>
        </div>

        <section className={styles.mobileJourneySummary} aria-label="Your journey summary">
          <p className={styles.mobileJourneyEyebrow}>Your journey today</p>
          <div className={styles.mobileJourneyHeader}>
            <div>
              <p className={styles.mobileJourneyGreeting}>{mobileGreeting}, {firstName}</p>
              <p className={styles.mobileJourneyChapter}>You are in the {journeyChapter} stage</p>
            </div>
          </div>
          <div className={styles.mobileJourneyStats}>
            <span><strong>{energyScore}%</strong> Momentum</span>
            <span>{activeProjectsCount} active projects</span>
            <span>{data.recentNotifications.length} notifications</span>
          </div>
          <div className={styles.mobileJourneyNext}>
            <span>Next step</span>
            <strong>{data.primaryRecommendation.actionLabel}</strong>
          </div>
          <Link href="/profile?tab=missions" className={styles.mobileJourneyLink}>
            View my journey <span aria-hidden>→</span>
          </Link>
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
          <span className={styles.networkDot} aria-hidden />
          <Globe2 className="h-3.5 w-3.5" aria-hidden />
          Your network · {data.stats.connections + data.communities.length + data.stats.projects} connections & communities
        </div>
      </div>
    </div>
  );
}

export function HomeMobileCompanionPanels({ data }: { data: HomeEngineData }) {
  const router = useRouter();
  const [askQuery, setAskQuery] = useState("");
  const firstName = data.profile.full_name?.split(" ")[0] ?? "Builder";
  const missionTitle =
    data.missionEngine.lifeMission?.title ?? data.primaryMission?.title ?? "Define your north star";
  const checklist = data.missionEngine.dailyMissions.slice(0, 4);
  const nextPendingMission = checklist.find((item) => item.status === "pending");
  const companionRecommendations = selectCompactRecommendations(data.opportunityRecommendations, 3);
  const history = data.impactEngine.history.slice(-8);
  const storyPoints = (() => {
    if (history.length < 2) return null;
    const scores = history.map((item) => item.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const span = Math.max(1, max - min);
    return history.map((item, index) => ({
      x: (index / (history.length - 1)) * 300,
      y: 48 - ((item.score - min) / span) * 40,
    }));
  })();
  const storyPath = storyPoints
    ? storyPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")
    : "";

  const handleAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = askQuery.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <aside className={styles.mobileCompanionPanels} aria-label="Focus, story and AI companion">
      <Panel eyebrow="Today's focus" title={missionTitle} icon={Target}>
        {checklist.length > 0 ? (
          <ul className={styles.checklist}>
            {checklist.map((item) => (
              <li key={item.id} className={styles.checkRow} data-done={item.status === "completed"}>
                <span className={styles.checkDot} aria-hidden>
                  {item.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
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
              <linearGradient id="story-line-gradient-mobile" x1="0" x2="1">
                <stop offset="0" stopColor="#a78bfa" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <path className={styles.storyPath} d={storyPath} stroke="url(#story-line-gradient-mobile)" />
            {storyPoints.map((point, index) => (
              <circle key={index} className={styles.storyDot} cx={point.x} cy={point.y} r={2.2} />
            ))}
          </svg>
        ) : (
          <p className="text-xs leading-5 text-white/45">Your impact story will take shape as you build.</p>
        )}
        <p className="mt-3 text-xs leading-5 text-white/55">
          You&apos;ve connected with {data.stats.connections} {data.stats.connections === 1 ? "person" : "people"} and
          joined {data.communities.length} {data.communities.length === 1 ? "community" : "communities"} on BELONG.
        </p>
        <Link href="/profile?tab=impact" className={styles.panelLink}>
          See my full story <span aria-hidden>→</span>
        </Link>
      </Panel>

      <Panel eyebrow="AI companion" title="Next best move" icon={Bot} id="ai-companion-mobile">
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
          <label htmlFor="ai-ask-input-mobile" className="sr-only">Ask me anything</label>
          <div className="flex items-center gap-2">
            <input
              id="ai-ask-input-mobile"
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
  );
}
