"use client";

import type { HomeActivity, HomeActivityType } from "@/engines/belong/home/types";
import { Avatar } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  FolderKanban,
  Handshake,
  Lightbulb,
  MessageCircle,
  PartyPopper,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";
import Link from "next/link";
import { GlassCard, SectionHeader } from "../dashboard/primitives";
import styles from "./home-live-builders.module.css";

type StatusTone = "emerald" | "amber" | "violet" | "pink" | "cyan";

type StatusConfig = {
  label: string;
  cta: string;
  badgeClassName: string;
  tone: StatusTone;
  icon: ComponentType<{ className?: string }>;
};

const STATUS_BY_TYPE: Record<HomeActivityType, StatusConfig> = {
  project: {
    label: "Building",
    cta: "View project",
    badgeClassName: "border-emerald-300/25 bg-emerald-600/90 text-white",
    tone: "emerald",
    icon: FolderKanban,
  },
  collaboration_request: {
    label: "Needs help",
    cta: "Offer to help",
    badgeClassName: "border-amber-300/25 bg-amber-600/90 text-white",
    tone: "amber",
    icon: Handshake,
  },
  idea: {
    label: "Looking for feedback",
    cta: "Give feedback",
    badgeClassName: "border-violet-300/25 bg-violet-600/90 text-white",
    tone: "violet",
    icon: Lightbulb,
  },
  achievement: {
    label: "Celebration",
    cta: "Celebrate",
    badgeClassName: "border-pink-300/25 bg-pink-600/90 text-white",
    tone: "pink",
    icon: PartyPopper,
  },
  event: {
    label: "Shared update",
    cta: "View update",
    badgeClassName: "border-cyan-300/25 bg-cyan-600/90 text-white",
    tone: "cyan",
    icon: Calendar,
  },
  community: {
    label: "Shared update",
    cta: "View update",
    badgeClassName: "border-cyan-300/25 bg-cyan-600/90 text-white",
    tone: "cyan",
    icon: Users,
  },
  organization: {
    label: "Shared update",
    cta: "View update",
    badgeClassName: "border-cyan-300/25 bg-cyan-600/90 text-white",
    tone: "cyan",
    icon: Users,
  },
  post: {
    label: "Shared update",
    cta: "View update",
    badgeClassName: "border-cyan-300/25 bg-cyan-600/90 text-white",
    tone: "cyan",
    icon: MessageCircle,
  },
};

function reactionCount(activity: HomeActivity) {
  return Object.values(activity.reactions).reduce((sum, count) => sum + (count ?? 0), 0);
}

/** Only the real "project" activities carry a numeric progress value today
 * (see feed-builder.ts buildProjectActivities meta.progress) — every other
 * activity type has no progress data, so we never fabricate one. */
function activityProgress(activity: HomeActivity): number | null {
  const raw = activity.meta?.progress;
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function HomeLiveBuilders({ activities }: { activities: HomeActivity[] }) {
  const items = activities.slice(0, 8);

  return (
    <section aria-label="Live builders">
      <div className="hidden sm:block">
        <SectionHeader
          label="Live builders"
          title="People building right now — jump in, support, collaborate."
          icon={UsersRound}
          action={
            <Link href="/feed" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        />
      </div>
      <div className="mb-3 flex items-end justify-between gap-3 sm:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-primary">
            Live builders
          </p>
          <p className="mt-1 text-[11px] leading-4 text-fg-muted">
            People building now.
          </p>
        </div>
        <Link href="/feed" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand">
          View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {items.length === 0 ? (
        <GlassCard className="px-6 py-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-brand" aria-hidden />
          <p className="mt-3 text-body text-fg-secondary">
            Real activity from your world will show up here as builders post updates, ship projects, and ask for
            help.
          </p>
          <Link href="/community" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
            Explore the community
          </Link>
        </GlassCard>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {items.map((activity) => {
            const status = STATUS_BY_TYPE[activity.type];
            const ArtIcon = status.icon;
            const reactions = reactionCount(activity);
            const progress = activityProgress(activity);
            // Real photo priority: activity.imageUrl (rarely populated today)
            // then the real author photo (populated for collaboration
            // requests). Everything else gets the branded gradient fallback —
            // never a fabricated or stock photo.
            const mediaSrc = activity.imageUrl ?? activity.author.avatarUrl ?? null;

            return (
              <GlassCard
                key={activity.id}
                hover
                className="min-w-[84%] shrink-0 snap-start overflow-hidden sm:min-w-[300px]"
              >
                <div className={styles.mediaFrame}>
                  {mediaSrc ? (
                    // Dynamic/external photo URL (real Supabase storage post image,
                    // or a real author avatar for collaboration requests). next.config.ts
                    // has no images.remotePatterns configured, so next/image would reject
                    // this external host — we intentionally use a plain <img> here,
                    // matching the Avatar component's established pattern
                    // (components/ui/avatar.tsx) for the same reason.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaSrc} alt="" className={styles.mediaImg} loading="lazy" />
                  ) : (
                    <div className={styles.fallback} data-tone={status.tone} aria-hidden>
                      <ArtIcon className={styles.fallbackIcon} aria-hidden />
                    </div>
                  )}

                  <span className={cn(styles.badge, "inline-flex items-center rounded-full border px-2.5 py-1 text-micro font-semibold uppercase tracking-wide backdrop-blur", status.badgeClassName)}>
                    {status.label}
                  </span>

                  <div className={styles.scrim} aria-hidden />

                  <div className={styles.overlay}>
                    <div className="min-w-0">
                      <p className={cn(styles.name, "truncate")}>{activity.author.name}</p>
                      <p className={styles.desc}>{activity.title}</p>
                    </div>

                    {progress !== null ? (
                      <div className={styles.progressRow}>
                        <div className={styles.progressTrack}>
                          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                        </div>
                        <span className={styles.progressValue}>{progress}%</span>
                      </div>
                    ) : activity.contextLabel ? (
                      <span className={cn(styles.tag, "truncate")}>{activity.contextLabel}</span>
                    ) : null}

                    <div className={styles.footer}>
                      <div className={styles.footerLeft}>
                        <Avatar
                          src={activity.author.avatarUrl ?? undefined}
                          fallback={formatInitials(activity.author.name)}
                          size="sm"
                          className="h-7 w-7 rounded-full ring-2 ring-white/10"
                        />
                        <span className={styles.footerMeta}>
                          <MessageCircle className="h-3 w-3" aria-hidden />
                          {activity.commentCount + reactions}
                        </span>
                      </div>
                      <Link href={activity.href} className={styles.cta}>
                        <span>{status.cta}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
