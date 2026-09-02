"use client";

import type { SocialProfilePage } from "@/engines/social";
import { Avatar, Badge, Button, Card, CardContent, EmptyState } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { CollaborationProposeDialog } from "@/components/features/collaboration/collaboration-propose-dialog";
import { FolderKanban, Handshake, MapPin, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { SocialConnectionActions } from "./social-connection-actions";
import { SocialFeed } from "./social-feed";
import styles from "./social-feed.module.css";

const tabs = ["posts", "about", "projects", "communities", "impact"] as const;
type ProfileTab = (typeof tabs)[number];

export function SocialProfileView({
  page,
  initialTab = "posts",
}: {
  page: SocialProfilePage;
  initialTab?: ProfileTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const { profile, viewer, stats } = page;

  return (
    <div className={`${styles.shell} space-y-5`}>
      <section className="overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(145deg,rgba(139,92,246,.1),rgba(255,255,255,.025)_42%,rgba(34,211,238,.06))]">
        <div className="h-28 bg-[radial-gradient(circle_at_24%_0%,rgba(139,92,246,.38),transparent_45%),radial-gradient(circle_at_78%_20%,rgba(34,211,238,.2),transparent_40%)] sm:h-36" />
        <div className="-mt-12 px-4 pb-5 sm:-mt-14 sm:px-6 sm:pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <Avatar
                src={profile.avatarUrl ?? undefined}
                fallback={formatInitials(profile.fullName)}
                size="xl"
                className="h-24 w-24 border-4 border-bg-base shadow-[0_0_32px_rgba(139,92,246,.28)] sm:h-28 sm:w-28"
              />
              <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight text-fg-primary sm:text-3xl">
                {profile.fullName ?? "BELONG builder"}
              </h1>
              {profile.headline && <p className="mt-1 text-sm text-brand">{profile.headline}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {profile.location}
                  </span>
                )}
                <span>{stats.connectionCount} connections</span>
                <span>{stats.projectCount} projects</span>
                <span>{stats.communityCount} communities</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {page.isSelf ? (
                <Link href="/settings?tab=profile">
                  <Button variant="secondary">Edit profile</Button>
                </Link>
              ) : (
                <>
                  <SocialConnectionActions
                    userId={profile.id}
                    name={profile.fullName ?? "this builder"}
                    initialState={page.connectionState}
                    connectionId={page.connectionId}
                  />
                  <Button variant="outline" onClick={() => setCollaborationOpen(true)}>
                    <Handshake className="h-4 w-4" aria-hidden />
                    Propose collaboration
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {!page.isSelf && (
        <CollaborationProposeDialog
          open={collaborationOpen}
          onClose={() => setCollaborationOpen(false)}
          partnerId={profile.id}
          partnerName={profile.fullName ?? "this builder"}
        />
      )}

      <nav className={styles.tabs} aria-label="Profile sections">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setTab(item);
              const params = new URLSearchParams(window.location.search);
              params.set("tab", item);
              params.delete("cursor");
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }}
            className={`min-h-11 shrink-0 rounded-xl px-4 text-xs font-semibold uppercase tracking-[0.08em] transition ${
              tab === item ? "bg-brand/15 text-brand" : "text-fg-muted hover:bg-white/5 hover:text-fg-primary"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {tab === "posts" && (
        <SocialFeed
          page={page.posts}
          viewer={viewer}
          contexts={page.publishingContexts}
          showComposer={page.isSelf}
          emptyTitle={page.isSelf ? "Nothing shared yet." : "Nothing shared yet."}
          loadMoreHref={`${pathname}?tab=posts`}
        />
      )}

      {tab === "about" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div>
                <p className="text-label">About</p>
                <p className="mt-2 whitespace-pre-wrap text-body">
                  {profile.bio || "This builder has not added a bio yet."}
                </p>
              </div>
              {profile.buildGoal && (
                <div>
                  <p className="text-label">What they are building</p>
                  <p className="mt-2 text-body">{profile.buildGoal}</p>
                </div>
              )}
              <TagGroup label="Interests" items={profile.interests} />
              <TagGroup label="Skills" items={profile.skills} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-label">Living impact</p>
              <div className="mt-4 space-y-3">
                <Metric label="Impact score" value={String(stats.impactScore)} />
                <Metric label="Shared posts" value={String(stats.postCount)} />
                <Metric label="Supported by others" value={String(stats.supportCount)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "projects" && (
        <EntityList
          icon={FolderKanban}
          empty="No projects to show yet."
          items={page.projects.map((item) => ({
            id: item.id,
            title: item.name,
            detail: item.status,
            href: `/projects/${item.id}`,
          }))}
        />
      )}

      {tab === "communities" && (
        <EntityList
          icon={Users}
          empty="No communities to show yet."
          items={page.communities.map((item) => ({
            id: item.id,
            title: item.name,
            detail: item.role,
            href: `/community/${item.slug}`,
          }))}
        />
      )}

      {tab === "impact" && (
        <Card>
          <CardContent className="pt-6">
            {page.impact.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Impact is still taking shape"
                description="Verified contributions and achievements will appear here."
              />
            ) : (
              <div className="space-y-3">
                {page.impact.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/6 bg-white/[0.025] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-fg-primary">{item.title}</p>
                        {item.description && <p className="mt-1 text-sm text-fg-muted">{item.description}</p>}
                      </div>
                      <Badge variant="brand">+{item.points}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TagGroup({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-label">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/6 pb-3 last:border-0">
      <span className="text-sm text-fg-muted">{label}</span>
      <span className="font-semibold text-fg-primary">{value}</span>
    </div>
  );
}

function EntityList({
  icon: Icon,
  empty,
  items,
}: {
  icon: typeof Users;
  empty: string;
  items: Array<{ id: string; title: string; detail: string | null; href: string }>;
}) {
  if (items.length === 0) {
    return <EmptyState icon={Icon} title={empty} description="Keep building your BELONG world." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link key={item.id} href={item.href}>
          <Card className="h-full transition hover:border-brand/30">
            <CardContent className="flex items-center gap-3 pt-5">
              <div className="rounded-xl bg-brand/10 p-2.5 text-brand">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-fg-primary">{item.title}</p>
                {item.detail && <p className="mt-1 truncate text-xs capitalize text-fg-muted">{item.detail}</p>}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
