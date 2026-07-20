"use client";

import { cn } from "@/lib/utils";
import {
  ArrowRight,
  FolderKanban,
  Lightbulb,
  Plus,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PrimaryActionId =
  | "join_community"
  | "create_community"
  | "share_idea"
  | "start_project"
  | "complete_mission";

type ActionConfig = {
  id: PrimaryActionId;
  label: string;
  description: string;
  icon: LucideIcon;
  featured?: boolean;
};

export function HomePrimaryActions({
  isNewUser,
  onAction,
}: {
  isNewUser: boolean;
  onAction: (action: PrimaryActionId) => void;
}) {
  const actions: ActionConfig[] = isNewUser
    ? [
        {
          id: "join_community",
          label: "Join a community",
          description: "Find people building around topics you care about.",
          icon: Users,
          featured: true,
        },
        {
          id: "create_community",
          label: "Create a community",
          description: "Start a space for your mission, team, or cause.",
          icon: Plus,
        },
        {
          id: "share_idea",
          label: "Share your first idea",
          description: "Introduce yourself once you have joined a community.",
          icon: Lightbulb,
        },
      ]
    : [
        {
          id: "share_idea",
          label: "Share an idea",
          description: "Post to your community and invite conversation.",
          icon: Lightbulb,
          featured: true,
        },
        {
          id: "start_project",
          label: "Start a project",
          description: "Turn an idea into something you build with others.",
          icon: FolderKanban,
        },
        {
          id: "join_community",
          label: "Find collaborators",
          description: "Discover communities and people to work with.",
          icon: Users,
        },
        {
          id: "complete_mission",
          label: "Complete a mission",
          description: "Take your next daily step toward your goals.",
          icon: Target,
        },
      ];

  return (
    <section aria-labelledby="home-primary-actions">
      <div className="mb-4">
        <p className="text-label">{isNewUser ? "Start here" : "Primary actions"}</p>
        <h2 id="home-primary-actions" className="text-heading mt-1 text-fg-primary">
          {isNewUser ? "What should you do first?" : "What do you want to do today?"}
        </h2>
        {isNewUser && (
          <p className="mt-2 max-w-xl text-body text-fg-muted">
            Most builders start by joining a community, then sharing their first idea.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {actions.map(({ id, label, description, icon: Icon, featured }) => (
          <button
            key={id}
            type="button"
            onClick={() => onAction(id)}
            className={cn(
              "group flex h-full flex-col rounded-2xl border px-5 py-4 text-left transition-all",
              featured
                ? "border-brand/30 bg-brand/10 hover:border-brand/50 hover:bg-brand/15"
                : "border-border-subtle bg-white/[0.02] hover:border-border-strong hover:bg-white/[0.04]"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  featured ? "bg-brand/20 text-brand" : "bg-white/[0.04] text-fg-muted"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <ArrowRight
                className={cn(
                  "h-4 w-4 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100",
                  featured ? "text-brand" : "text-fg-faint"
                )}
                aria-hidden
              />
            </div>
            <p className="mt-4 text-sm font-semibold text-fg-primary">{label}</p>
            <p className="mt-1 text-caption leading-relaxed text-fg-muted">{description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
