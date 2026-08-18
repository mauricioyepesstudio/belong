"use client";

import type { WeeklyGoal } from "@/engines/mission/types";
import { ArrowRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GlassCard, SectionHeader } from "../dashboard/primitives";
import styles from "./home-missions-row.module.css";

type MissionArtBucket = "startup" | "community" | "growth" | "portfolio" | "default";

// Expected future per-mission illustrations — none of these files exist in
// the repo yet (see public/images/, which only has home-world.webp today).
// Until real artwork is delivered, the onError handler below keeps the
// placeholder gradient texture visible instead of a broken-image icon.
const MISSION_ART_SRC: Record<MissionArtBucket, string> = {
  startup: "/images/missions/mission-startup.webp",
  community: "/images/missions/mission-community.webp",
  growth: "/images/missions/mission-growth.webp",
  portfolio: "/images/missions/mission-portfolio.webp",
  default: "/images/missions/mission-default.webp",
};

const BUCKET_RULES: Array<{ keywords: string[]; bucket: MissionArtBucket }> = [
  { keywords: ["startup", "launch", "build your", "ship", "prototype"], bucket: "startup" },
  { keywords: ["community", "network", "connect", "people", "collaborat"], bucket: "community" },
  { keywords: ["skill", "learn", "grow", "course", "study"], bucket: "growth" },
  { keywords: ["portfolio", "project", "create", "design"], bucket: "portfolio" },
];

// Matches against both title and description so a mission like
// { title: "Weekly check-in", description: "Publish 2 case studies to your portfolio" }
// still lands in the right bucket even when the title alone is generic.
function missionArtBucket(goal: WeeklyGoal): MissionArtBucket {
  const haystack = `${goal.title} ${goal.description ?? ""}`.toLowerCase();
  return BUCKET_RULES.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)))?.bucket ?? "default";
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function HomeMissionsRow({
  goals,
  onCreateMission,
}: {
  goals: WeeklyGoal[];
  onCreateMission: () => void;
}) {
  const cards = goals.slice(0, 4);
  // Tracks which mission art assets have failed to load (all of them today —
  // the files under public/images/missions/ don't exist yet) so the
  // <Image> element is removed and the CSS gradient fallback shows cleanly
  // instead of a broken-image icon. Same onError pattern as WORLD_ART_SRC in
  // home-universe.tsx.
  const [missingArt, setMissingArt] = useState<Set<string>>(new Set());

  const markArtMissing = (goalId: string) => {
    setMissingArt((prev) => {
      if (prev.has(goalId)) return prev;
      const next = new Set(prev);
      next.add(goalId);
      return next;
    });
  };

  return (
    <section aria-labelledby="missions-row-heading">
      <SectionHeader
        label="Your missions"
        title="Your path. Your pace. We're with you."
        action={
          <Link href="/profile?tab=missions" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            View all missions <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      />

      <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {cards.map((goal) => {
          const percent = clampPercent((goal.current_count / Math.max(1, goal.target_count)) * 100);
          const bucket = missionArtBucket(goal);
          const artSrc = MISSION_ART_SRC[bucket];
          const artMissing = missingArt.has(goal.id);

          return (
            <Link
              key={goal.id}
              href={goal.action_href || "/profile?tab=missions"}
              className="min-w-[84%] shrink-0 snap-start sm:min-w-[240px]"
            >
              <GlassCard hover glow className={styles.card} data-bucket={bucket}>
                <div className={styles.artStage}>
                  <div className={styles.artFallback} data-bucket={bucket} aria-hidden />
                  {!artMissing && (
                    <Image
                      src={artSrc}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 240px, 78vw"
                      className={styles.artImage}
                      onError={() => markArtMissing(goal.id)}
                    />
                  )}
                  <p className={styles.title}>{goal.title}</p>
                </div>

                <div className={styles.body}>
                  <div className={styles.progressText}>
                    <span>
                      {goal.current_count} / {goal.target_count} steps completed
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                  </div>
                  {goal.description && (
                    <p className={styles.nextStep}>Next step: {goal.description}</p>
                  )}
                </div>
              </GlassCard>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onCreateMission}
          className="min-w-[84%] shrink-0 snap-start sm:min-w-[240px]"
        >
          <GlassCard hover className={`${styles.card} flex-col items-center justify-center gap-2 border-dashed p-4 text-center`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Plus className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-fg-primary">Create New Mission</p>
            <p className="text-micro text-fg-muted">Define what you want to achieve</p>
          </GlassCard>
        </button>
      </div>

      {cards.length === 0 && (
        <p className="mt-3 text-caption text-fg-muted">
          You don&apos;t have any active weekly goals yet — create a mission to start tracking progress.
        </p>
      )}
    </section>
  );
}
