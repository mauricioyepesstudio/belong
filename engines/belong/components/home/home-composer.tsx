"use client";

import type { ComposerContentType, PublishIntention } from "@/engines/belong/home/types";
import type { UserCommunity } from "@/lib/core";
import { createCommunityPost } from "@/lib/actions/communities";
import type { UserProfile } from "@/types/database.types";
import { Avatar, useToast } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  HandHeart,
  HelpCircle,
  ImageIcon,
  Lightbulb,
  PartyPopper,
  Sparkles,
  Target,
  Type,
  Users,
  Video,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "../dashboard/primitives";

const CONTENT_TYPES: { id: ComposerContentType; label: string; icon: LucideIcon }[] = [
  { id: "text", label: "Text", icon: Type },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
  { id: "poll", label: "Poll", icon: BarChart3 },
  { id: "article", label: "Article", icon: BookOpen },
  { id: "project", label: "Project", icon: Wrench },
  { id: "event", label: "Event", icon: CalendarDays },
  { id: "opportunity", label: "Opportunity", icon: Target },
];

const INTENTIONS: { id: PublishIntention; label: string; icon: LucideIcon }[] = [
  { id: "inspire", label: "Inspire", icon: Sparkles },
  { id: "ask", label: "Ask", icon: HelpCircle },
  { id: "teach", label: "Teach", icon: Lightbulb },
  { id: "collaborate", label: "Collaborate", icon: Users },
  { id: "build", label: "Build", icon: Wrench },
  { id: "celebrate", label: "Celebrate", icon: PartyPopper },
  { id: "support", label: "Support", icon: HandHeart },
];

export function HomeComposer({
  profile,
  communities,
  expanded: controlledExpanded,
  onExpandedChange,
  onNeedCommunity,
}: {
  profile: UserProfile;
  communities: UserCommunity[];
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onNeedCommunity?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? "");
  const [contentType, setContentType] = useState<ComposerContentType>("text");
  const [intention, setIntention] = useState<PublishIntention>("inspire");
  const [showIntention, setShowIntention] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const expanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  const handleFocus = () => {
    if (communities.length === 0) {
      toast("Join a community first to share a post", "error");
      onNeedCommunity?.();
      return;
    }
    setExpanded(true);
  };

  const handlePublishClick = () => {
    if (!content.trim()) {
      toast("Write something before publishing", "error");
      return;
    }
    if (communities.length === 0) {
      toast("Join a community first to share a post", "error");
      onNeedCommunity?.();
      return;
    }
    if (contentType !== "text") {
      toast("Only text posts are supported from Home right now. Open the community page for other formats.", "error");
      return;
    }
    if (!showIntention) {
      setShowIntention(true);
      return;
    }

    startTransition(async () => {
      const result = await createCommunityPost(communityId, content.trim());
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast("Post published", "success");
      setContent("");
      setShowIntention(false);
      setExpanded(false);
      router.refresh();
    });
  };

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-3">
          <Avatar src={profile.avatar_url ?? undefined} fallback={initials} size="md" />
          <div className="min-w-0 flex-1">
            {!expanded ? (
              <button
                type="button"
                onClick={handleFocus}
                className="w-full rounded-2xl border border-border-subtle bg-white/[0.02] px-4 py-3.5 text-left text-body text-fg-muted transition-all hover:border-brand/30 hover:bg-brand/5 hover:text-fg-secondary"
              >
                What do you want to share today?
              </button>
            ) : (
              <>
                {communities.length > 1 && (
                  <select
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="mb-3 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-fg-primary"
                    aria-label="Choose community"
                  >
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share an idea, invite collaborators, or start a conversation…"
                  className="w-full resize-none rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3 text-body text-fg-primary outline-none transition-colors placeholder:text-fg-faint focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
                />
              </>
            )}
          </div>
        </div>

        {expanded && (
          <>
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <p className="mb-3 text-micro font-semibold uppercase tracking-wider text-fg-faint">
                Content type
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CONTENT_TYPES.map(({ id, label, icon: Icon }) => {
                  const active = contentType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setContentType(id)}
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

            {showIntention && (
              <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/5 p-4">
                <p className="mb-3 text-sm font-medium text-fg-primary">What is your intention?</p>
                <div className="flex flex-wrap gap-2">
                  {INTENTIONS.map(({ id, label, icon: Icon }) => {
                    const active = intention === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setIntention(id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-micro font-medium transition-all",
                          active
                            ? "border-brand/40 bg-brand/15 text-brand"
                            : "border-border-subtle bg-bg-surface text-fg-muted hover:text-fg-secondary"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption text-fg-muted">
            {communities.length === 0
              ? "Join a community to publish from Home"
              : expanded
                ? showIntention
                  ? "Ready to share with intention"
                  : "Choose your intention before publishing"
                : "Text posts publish to your community"}
          </p>
          {expanded && (
            <button
              type="button"
              onClick={handlePublishClick}
              disabled={isPending}
              className="rounded-2xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Publishing…" : showIntention ? "Publish" : "Continue"}
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
