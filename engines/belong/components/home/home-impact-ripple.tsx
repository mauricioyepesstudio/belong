"use client";

import type { HomeActivity } from "@/engines/belong/home/types";
import type { ImpactEngineData } from "@/engines/impact/types";
import type { UserProfile } from "@/types/database.types";
import { Avatar } from "@/systems/design-system";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { Globe2, Heart, Rocket, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { GlassCard, SectionHeader } from "../dashboard/primitives";
import styles from "./home-impact-ripple.module.css";

const RIPPLE_ICON: Record<string, ComponentType<{ className?: string }>> = {
  Network: UsersRound,
  Build: Rocket,
  Community: Globe2,
  Contribution: Heart,
};

// Elliptical orbit layout for the ripple nodes — wider on X than Y so the
// spread reads as a tilted ellipse around the core avatar, matching the
// approved reference composition rather than a perfect circle.
function ripplePosition(index: number, count: number) {
  const angle = (index / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2;
  const radiusX = 40;
  const radiusY = 34;
  return {
    x: 50 + Math.cos(angle) * radiusX,
    y: 50 + Math.sin(angle) * radiusY,
  };
}

export function HomeImpactRipple({
  impactEngine,
  latestImpact,
  profile,
}: {
  impactEngine: ImpactEngineData;
  latestImpact: HomeActivity | null;
  profile: Pick<UserProfile, "full_name" | "avatar_url">;
}) {
  const { weeklyImpact, ripple } = impactEngine;
  const count = ripple.length;

  return (
    <section aria-labelledby="impact-ripple-heading">
      <SectionHeader
        label="Your impact ripple"
        title="Every action creates a ripple. You're changing more lives than you think."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.75fr)_minmax(380px,2fr)_minmax(220px,0.75fr)] lg:items-stretch">
        <GlassCard className="p-5 lg:p-6" glow>
          <div className="flex items-center justify-between gap-3">
            <p className="text-label">This week</p>
            <span className={styles.cardIcon} aria-hidden>
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-fg-primary">{weeklyImpact.points}</p>
          <p className="text-caption text-fg-muted">impact points earned</p>
          <p className="mt-3 text-caption text-fg-muted">
            From {weeklyImpact.contributionsLogged} logged action{weeklyImpact.contributionsLogged === 1 ? "" : "s"},{" "}
            {weeklyImpact.missionsCompleted} mission{weeklyImpact.missionsCompleted === 1 ? "" : "s"} and{" "}
            {weeklyImpact.goalsCompleted} goal{weeklyImpact.goalsCompleted === 1 ? "" : "s"} completed.
          </p>
          <Link href="/profile?tab=impact" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
            View my full impact →
          </Link>
        </GlassCard>

        <GlassCard className="flex items-center justify-center p-4 lg:p-6" glow>
          <div className={styles.stage}>
            {/* ambient tri-tone glow (cyan / violet / green — impact & growth) */}
            <div className={styles.ambient} aria-hidden />

            {/* elliptical orbit rings, tilted slightly off-axis */}
            <span className={`${styles.orbit} ${styles.orbitC}`} aria-hidden />
            <span className={`${styles.orbit} ${styles.orbitB}`} aria-hidden />
            <span className={`${styles.orbit} ${styles.orbitA}`} aria-hidden />

            {/* expanding ripple pulses */}
            <span className={styles.wave} aria-hidden />
            <span className={`${styles.wave} ${styles.wave2}`} aria-hidden />
            <span className={`${styles.wave} ${styles.wave3}`} aria-hidden />

            {/* glowing connection lines from the core to each impact node,
                reusing the hero world stage's gradient-line technique */}
            <svg className={styles.connections} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                {ripple.map((ring, index) => (
                  <linearGradient key={ring.label} id={`ripple-line-${index}`} x1="0" x2="1">
                    <stop offset="0" stopColor={ring.color} stopOpacity="0" />
                    <stop offset="0.55" stopColor={ring.color} stopOpacity="0.85" />
                    <stop offset="1" stopColor={ring.color} stopOpacity="0" />
                  </linearGradient>
                ))}
              </defs>
              {ripple.map((ring, index) => {
                const { x, y } = ripplePosition(index, count);
                return <path key={ring.label} d={`M50 50 L${x} ${y}`} stroke={`url(#ripple-line-${index})`} />;
              })}
            </svg>

            <div className={styles.core}>
              <Avatar
                src={profile.avatar_url ?? undefined}
                fallback={formatInitials(profile.full_name)}
                size="lg"
                className="h-32 w-32 rounded-full"
              />
            </div>

            {ripple.map((ring, index) => {
              const { x, y } = ripplePosition(index, count);
              const Icon = RIPPLE_ICON[ring.label] ?? Heart;
              return (
                <div
                  key={ring.label}
                  className={styles.ripplePoint}
                  style={{ left: `${x}%`, top: `${y}%`, color: ring.color }}
                  title={`${ring.label}: ${ring.value}`}
                >
                  <span className={styles.rippleDot}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className={styles.rippleValue}>{ring.value}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5 lg:p-6" glow>
          <div className="flex items-center justify-between gap-3">
            <p className="text-label">Latest impact</p>
            <span className={styles.cardIcon} aria-hidden>
              <Sparkles className="h-3.5 w-3.5" />
            </span>
          </div>
          {latestImpact ? (
            <>
              <p className="mt-2 text-sm leading-6 text-fg-secondary">{latestImpact.title}</p>
              <p className="mt-2 text-micro text-fg-faint">{formatDistanceToNow(latestImpact.createdAt)}</p>
              <Link href={latestImpact.href} className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
                See more →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm leading-6 text-fg-muted">
              Your next contribution will show up here — your ripple keeps growing.
            </p>
          )}
        </GlassCard>
      </div>
    </section>
  );
}
