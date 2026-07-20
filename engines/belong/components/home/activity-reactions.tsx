"use client";

import type { BelongReaction } from "@/engines/belong/home/types";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  HandHeart,
  Lightbulb,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

const REACTION_CONFIG: Record<
  BelongReaction,
  { label: string; icon: LucideIcon; activeClass: string }
> = {
  helpful: {
    label: "Helpful",
    icon: ThumbsUp,
    activeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  inspired: {
    label: "Inspired",
    icon: Sparkles,
    activeClass: "bg-brand/15 text-brand border-brand/30",
  },
  collaborate: {
    label: "I'd Collaborate",
    icon: Users,
    activeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  },
  learned: {
    label: "Learned",
    icon: BookOpen,
    activeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  count_me_in: {
    label: "Count Me In",
    icon: HandHeart,
    activeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
};

export function ActivityReactions({
  reactions,
  compact = false,
}: {
  reactions: Partial<Record<BelongReaction, number>>;
  compact?: boolean;
}) {
  const [active, setActive] = useState<Partial<Record<BelongReaction, boolean>>>({});

  return (
    <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
      {(Object.keys(REACTION_CONFIG) as BelongReaction[]).map((key) => {
        const config = REACTION_CONFIG[key];
        const Icon = config.icon;
        const count = reactions[key] ?? 0;
        const isActive = active[key];

        return (
          <button
            key={key}
            type="button"
            onClick={() => setActive((prev) => ({ ...prev, [key]: !prev[key] }))}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-white/[0.02] px-3 py-1.5 text-micro font-medium text-fg-muted transition-all hover:border-border-strong hover:bg-white/[0.04] hover:text-fg-secondary",
              compact && "px-2.5 py-1",
              isActive && config.activeClass
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span>{config.label}</span>
            {count > 0 && (
              <span className={cn("text-fg-faint", isActive && "text-inherit")}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { REACTION_CONFIG };
