"use client";

import type { HomeActivity } from "@/engines/belong/home/types";
import type { TopContributor } from "@/engines/belong/home/types";
import type { HomeImpactMetrics } from "@/engines/belong/home/types";
import type { DiscoverCommunity } from "@/engines/core/types";
import type { ProjectWithMemberCount } from "@/lib/core";
import { ArrowRight, FolderKanban, Sparkles, TrendingUp, Users } from "lucide-react";
import type { ComponentType } from "react";
import Link from "next/link";
import { GlassCard, SectionHeader } from "../dashboard/primitives";
import { HomeNumbers } from "./home-numbers";
import styles from "./home-spotlight.module.css";

type TileTone = "violet" | "cyan" | "pink";

export function HomeSpotlight({
  topContributor,
  project,
  community,
  impactHighlight,
  metrics,
}: {
  topContributor: TopContributor | null;
  project: ProjectWithMemberCount | null;
  community: DiscoverCommunity | null;
  impactHighlight: HomeActivity | null;
  metrics: HomeImpactMetrics;
}) {
  return (
    <section aria-labelledby="spotlight-heading">
      <SectionHeader label="Builder spotlight" title="Stories that inspire." icon={Sparkles} />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1.9fr_0.9fr]">
        {topContributor ? (
          <Link href={topContributor.href}>
            <GlassCard hover className={styles.featureCard}>
              <div className={styles.featureText}>
                <p className="text-label">Top contributor</p>
                <p className={styles.featureName}>{topContributor.name}</p>
                <p className={styles.featureMeta}>
                  {topContributor.points.toLocaleString()} impact points earned
                </p>
                <span className={styles.featureCta}>
                  Read their story
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>

              <div className={styles.featureMedia}>
                {topContributor.avatarUrl ? (
                  // Dynamic/external photo URL from the user's real profile;
                  // no remotePatterns are configured for next/image, matching
                  // the Avatar component's established plain-<img> pattern.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={topContributor.avatarUrl} alt="" className={styles.featureImg} />
                ) : (
                  <div className={styles.featureFallback} aria-hidden>
                    <Sparkles className={styles.featureFallbackIcon} aria-hidden />
                  </div>
                )}
                <div className={styles.featureFade} aria-hidden />
              </div>
            </GlassCard>
          </Link>
        ) : (
          <GlassCard className="flex h-full min-h-[180px] items-center justify-center p-8 text-center">
            <p className="text-sm text-fg-muted">Top contributors will be spotlighted here as the community grows.</p>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SpotlightTile
            label="Project spotlight"
            icon={FolderKanban}
            tone="violet"
            title={project?.name ?? null}
            description={project?.description ?? null}
            imageUrl={null}
            href={project ? `/projects/${project.id}` : "/projects"}
            cta="View project"
            emptyLabel="No active projects to feature yet"
          />
          <SpotlightTile
            label="Community spotlight"
            icon={Users}
            tone="cyan"
            title={community?.name ?? null}
            description={community?.description ?? null}
            imageUrl={null}
            href={community ? `/community/${community.slug}` : "/community"}
            cta="Join community"
            emptyLabel="Communities will appear here as they grow"
          />
          <SpotlightTile
            label="Impact spotlight"
            icon={impactHighlight ? TrendingUp : Sparkles}
            tone="pink"
            title={impactHighlight?.title ?? null}
            description={impactHighlight?.contextLabel ?? null}
            imageUrl={impactHighlight?.imageUrl ?? impactHighlight?.author.avatarUrl ?? null}
            href={impactHighlight?.href ?? "/profile?tab=impact"}
            cta="View impact"
            emptyLabel="Your next impact moment will be featured here"
          />
        </div>

        <HomeNumbers metrics={metrics} variant="compact" />
      </div>
    </section>
  );
}

function SpotlightTile({
  label,
  icon: Icon,
  tone,
  title,
  description,
  imageUrl,
  href,
  cta,
  emptyLabel,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  tone: TileTone;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  href: string;
  cta: string;
  emptyLabel: string;
}) {
  return (
    <Link href={href}>
      <GlassCard hover className={styles.tileCard}>
        <div className={styles.tileHeader}>
          <p className={styles.tileLabel}>
            <Icon className="h-3 w-3" aria-hidden />
            {label}
          </p>
          {title ? (
            <>
              <p className={styles.tileTitle}>{title}</p>
              {description && <p className={styles.tileDesc}>{description}</p>}
            </>
          ) : (
            <p className={styles.tileDesc}>{emptyLabel}</p>
          )}
        </div>

        <div className={styles.tileMedia}>
          {imageUrl ? (
            // Dynamic/external photo URL (activity image or author avatar);
            // see comment above for why this uses a plain <img>.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className={styles.tileImg} />
          ) : (
            <div className={styles.tileFallback} data-tone={tone} aria-hidden>
              <Icon className={styles.tileFallbackIcon} aria-hidden />
            </div>
          )}
        </div>

        {title && (
          <span className={styles.tileCta}>
            {cta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </GlassCard>
    </Link>
  );
}
