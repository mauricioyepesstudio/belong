"use client";

import type { PublishPurpose } from "@/engines/belong/home/types";
import type { UserProfile } from "@/types/database.types";
import { Avatar } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  HandHeart,
  HelpCircle,
  Lightbulb,
  PartyPopper,
  PenLine,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "../dashboard/primitives";

const PURPOSES: { id: PublishPurpose; label: string; icon: LucideIcon }[] = [
  { id: "inspire", label: "Inspire", icon: Sparkles },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "ask", label: "Ask", icon: HelpCircle },
  { id: "teach", label: "Teach", icon: Lightbulb },
  { id: "collaborate", label: "Collaborate", icon: Users },
  { id: "build", label: "Build", icon: Wrench },
  { id: "celebrate", label: "Celebrate", icon: PartyPopper },
  { id: "support", label: "Support", icon: HandHeart },
];

export function HomeComposer({
  profile,
  onExpand,
}: {
  profile: UserProfile;
  onExpand?: () => void;
}) {
  const [selectedPurpose, setSelectedPurpose] = useState<PublishPurpose>("inspire");
  const [expanded, setExpanded] = useState(false);

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  const handleFocus = () => {
    setExpanded(true);
    onExpand?.();
  };

  return (
    <GlassCard glow className="overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-3">
          <Avatar
            src={profile.avatar_url ?? undefined}
            fallback={initials}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={handleFocus}
              className="w-full rounded-2xl border border-border-subtle bg-white/[0.02] px-4 py-3.5 text-left text-body text-fg-muted transition-all hover:border-brand/30 hover:bg-brand/5 hover:text-fg-secondary"
            >
              What do you want to share today?
            </button>

            {expanded && (
              <textarea
                rows={3}
                placeholder="Share an idea, ask a question, or invite collaborators…"
                className="mt-3 w-full resize-none rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3 text-body text-fg-primary outline-none transition-colors placeholder:text-fg-faint focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
              />
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="mb-3 text-micro font-semibold uppercase tracking-wider text-fg-faint">
            Publishing purpose
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PURPOSES.map(({ id, label, icon: Icon }) => {
              const active = selectedPurpose === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedPurpose(id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-micro font-medium transition-all",
                    active
                      ? "border-brand/40 bg-brand/15 text-brand"
                      : "border-border-subtle bg-white/[0.02] text-fg-muted hover:border-border-strong hover:text-fg-secondary"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-caption text-fg-muted">
            <PenLine className="h-4 w-4" aria-hidden />
            <span>Thought · Image · Video · Article · Poll · Project</span>
          </div>
          <button
            type="button"
            className="rounded-2xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Share with purpose
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
