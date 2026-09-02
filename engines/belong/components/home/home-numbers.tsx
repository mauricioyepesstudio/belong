import type { HomeImpactMetrics } from "@/engines/belong/home/types";
import { Activity, FolderKanban, HandHeart, Trophy, Users } from "lucide-react";
import { GlassCard, SectionHeader } from "../dashboard/primitives";
import styles from "./home-numbers.module.css";

type Tone = "violet" | "cyan" | "amber" | "pink";

const TILES = (metrics: HomeImpactMetrics): { label: string; value: number; icon: typeof HandHeart; tone: Tone }[] => [
  { label: "People you've helped", value: metrics.peopleHelped, icon: HandHeart, tone: "pink" },
  { label: "Projects you've built", value: metrics.projectsBuilt, icon: FolderKanban, tone: "cyan" },
  { label: "Collaborations", value: metrics.collaborations, icon: Users, tone: "violet" },
  { label: "Impact score", value: metrics.impactScore, icon: Trophy, tone: "amber" },
];

export function HomeNumbers({
  metrics,
  variant = "section",
}: {
  metrics: HomeImpactMetrics;
  variant?: "section" | "compact";
}) {
  const tiles = TILES(metrics);

  if (variant === "compact") {
    return (
      <GlassCard className="flex h-full flex-col gap-3 p-4">
        <p className={styles.compactHeading}>Belong in numbers</p>
        <div className={styles.compactList}>
          {tiles.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={styles.compactRow}>
              <span className={styles.iconChip} data-tone={tone} aria-hidden>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className={styles.compactText}>
                <span className={styles.compactValue}>{value.toLocaleString()}</span>
                <span className={styles.compactLabel}>{label}</span>
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <section aria-labelledby="belong-numbers-heading">
      <SectionHeader label="BELONG in numbers" title="What you're building, together." icon={Activity} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon }) => (
          <GlassCard key={label} className="p-4">
            <Icon className="h-4 w-4 text-brand" aria-hidden />
            <p className="mt-3 text-2xl font-semibold tabular-nums text-fg-primary">{value.toLocaleString()}</p>
            <p className="mt-1 text-micro text-fg-faint">{label}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
