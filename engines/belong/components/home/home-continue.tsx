"use client";

import type { ConversationPreview } from "@/lib/core";
import type { EventWithMeta } from "@/lib/core/events";
import type { ProjectWithMemberCount } from "@/lib/core";
import { formatEventDate } from "@/lib/format";
import {
  CalendarDays,
  FileEdit,
  FolderKanban,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPostDraft, type PostDraft } from "./draft-storage";
import { GlassCard } from "../dashboard/primitives";
import { Button } from "@/systems/design-system";

type ContinueItem = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  href: string;
};

function ContinueRow({ item }: { item: ContinueItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 rounded-xl border border-border-subtle bg-white/[0.02] px-4 py-3 transition-colors only:sm:col-span-2 hover:border-brand/30 hover:bg-brand/5"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg-primary">{item.title}</p>
        <p className="truncate text-caption text-fg-muted">{item.subtitle}</p>
      </div>
    </Link>
  );
}

export function HomeContinue({
  projects,
  conversations,
  events,
  onResumeDraft,
}: {
  projects: ProjectWithMemberCount[];
  conversations: ConversationPreview[];
  events: EventWithMeta[];
  onResumeDraft?: () => void;
}) {
  const [draft, setDraft] = useState<PostDraft | null>(null);

  useEffect(() => {
    setDraft(getPostDraft());
  }, []);

  const items: ContinueItem[] = [];

  for (const project of projects
    .filter((p) => p.status === "active" || p.status === "planning")
    .slice(0, 2)) {
    items.push({
      id: `project-${project.id}`,
      icon: FolderKanban,
      title: project.name,
      subtitle: `${project.progress}% complete · ${project.status}`,
      href: `/projects/${project.id}`,
    });
  }

  for (const conversation of conversations.slice(0, 2)) {
    items.push({
      id: `conversation-${conversation.id}`,
      icon: MessageSquare,
      title: conversation.name,
      subtitle: conversation.preview || "Continue the conversation",
      href: `/messages?conversation=${conversation.id}`,
    });
  }

  if (draft) {
    items.push({
      id: "draft-post",
      icon: FileEdit,
      title: "Draft post",
      subtitle: draft.content.slice(0, 60) + (draft.content.length > 60 ? "…" : ""),
      href: "#compose",
    });
  }

  for (const event of events.slice(0, 2)) {
    items.push({
      id: `event-${event.id}`,
      icon: CalendarDays,
      title: event.title,
      subtitle: formatEventDate(event.starts_at),
      href: `/events/${event.id}`,
    });
  }

  const visible = items.slice(0, 6);

  if (visible.length === 0) {
    return (
      <section aria-labelledby="home-continue-heading">
        <SectionHeading
          id="home-continue-heading"
          label="Resume"
          title="Continue where you left off"
        />
        <GlassCard className="px-5 py-6 text-center">
          <p className="text-sm text-fg-muted">
            Start a project, message someone, or join an event — your recent picks will show up
            here.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/community">
              <Button size="sm" variant="brand">
                Browse communities
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="sm" variant="secondary">
                View projects
              </Button>
            </Link>
          </div>
        </GlassCard>
      </section>
    );
  }

  return (
    <section aria-labelledby="home-continue-heading">
      <SectionHeading
        id="home-continue-heading"
        label="Resume"
        title="Continue where you left off"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((item) =>
          item.id === "draft-post" && onResumeDraft ? (
            <button
              key={item.id}
              type="button"
              onClick={onResumeDraft}
              className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-white/[0.02] px-4 py-3 text-left transition-colors only:sm:col-span-2 hover:border-brand/30 hover:bg-brand/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <FileEdit className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg-primary">{item.title}</p>
                <p className="truncate text-caption text-fg-muted">{item.subtitle}</p>
              </div>
            </button>
          ) : (
            <ContinueRow key={item.id} item={item} />
          )
        )}
      </div>
    </section>
  );
}

export function SectionHeading({
  id,
  label,
  title,
  description,
}: {
  id: string;
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3">
      <p className="text-label">{label}</p>
      <h2 id={id} className="text-heading mt-1 text-fg-primary">
        {title}
      </h2>
      {description && <p className="mt-1 text-caption text-fg-muted">{description}</p>}
    </div>
  );
}
