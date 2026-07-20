"use client";

import type { UserProfile } from "@/types/database.types";
import { formatGreeting } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  HandHeart,
  Lightbulb,
  Rocket,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "../dashboard/primitives";
import { ConnectionStatus, LiveBadge } from "@/engines/core/realtime";
import { FadeIn } from "@/components/motion/fade-in";

export type QuickActionId =
  | "share_idea"
  | "find_collaborators"
  | "start_project"
  | "join_community"
  | "complete_mission"
  | "help_someone"
  | "learn_something";

const QUICK_ACTIONS: {
  id: QuickActionId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "share_idea", label: "Share an Idea", icon: Lightbulb },
  { id: "find_collaborators", label: "Find Collaborators", icon: UserPlus },
  { id: "start_project", label: "Start a Project", icon: Rocket },
  { id: "join_community", label: "Join a Community", icon: Users },
  { id: "complete_mission", label: "Complete a Mission", icon: Target },
  { id: "help_someone", label: "Help Someone", icon: HandHeart },
  { id: "learn_something", label: "Learn Something", icon: BookOpen },
];

export function HomeHero({
  profile,
  onQuickAction,
}: {
  profile: UserProfile;
  onQuickAction: (action: QuickActionId) => void;
}) {
  const firstName = profile.full_name?.split(" ")[0] ?? "Builder";
  const greeting = formatGreeting();

  return (
    <FadeIn>
      <GlassCard glow className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="animate-aurora absolute -right-24 -top-32 h-72 w-72 rounded-full bg-brand/20 blur-[100px]" />
          <div
            className="animate-aurora absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-indigo-500/15 blur-[120px]"
            style={{ animationDelay: "-7s" }}
          />
        </div>

        <div className="relative p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-label">BELONG Home</p>
              <h1 className="text-heading-lg mt-2 text-fg-primary">
                {greeting}, {firstName}
              </h1>
              <p className="mt-3 max-w-lg text-body-lg text-fg-secondary">
                What do you want to accomplish today?
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LiveBadge label="Live" />
              <ConnectionStatus />
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-micro font-semibold uppercase tracking-wider text-fg-faint">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onQuickAction(id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-fg-secondary transition-all",
                    "hover:border-brand/30 hover:bg-brand/10 hover:text-fg-primary"
                  )}
                >
                  <Icon className="h-4 w-4 text-brand" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </FadeIn>
  );
}
