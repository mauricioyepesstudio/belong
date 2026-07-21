"use client";

import { FolderKanban, PenLine, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickActionId = "create_post" | "create_project" | "join_community" | "invite";

const ACTIONS: Array<{
  id: QuickActionId;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "create_post", label: "Create Post", icon: PenLine },
  { id: "create_project", label: "Create Project", icon: FolderKanban },
  { id: "join_community", label: "Join Community", icon: Users },
  { id: "invite", label: "Invite Someone", icon: UserPlus },
];

export function HomeQuickActions({
  onAction,
}: {
  onAction: (action: QuickActionId) => void;
}) {
  return (
    <section aria-labelledby="home-quick-actions-heading">
      <div className="mb-3">
        <p className="text-label">Actions</p>
        <h2 id="home-quick-actions-heading" className="text-heading mt-1 text-fg-primary">
          Quick actions
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onAction(id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border border-border-subtle",
              "bg-white/[0.02] px-3 py-4 text-center transition-colors",
              "hover:border-brand/30 hover:bg-brand/5 active:scale-[0.98]"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <span className="text-xs font-medium text-fg-primary">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
