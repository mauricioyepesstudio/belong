"use client";

import { joinCommunity } from "@/lib/actions/communities";
import { createCustomDailyMission } from "@/lib/actions/mission-engine";
import { createProject } from "@/lib/actions/projects";
import type { DiscoverCommunity } from "@/engines/core/types";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Label,
  Modal,
  SearchField,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { Compass, FolderKanban, Plus, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type DashboardActionsProps = {
  discoverCommunities: DiscoverCommunity[];
  missionOpen: boolean;
  onMissionOpenChange: (open: boolean) => void;
  projectOpen: boolean;
  onProjectOpenChange: (open: boolean) => void;
  communityOpen: boolean;
  onCommunityOpenChange: (open: boolean) => void;
};

export function DashboardActions({
  discoverCommunities,
  missionOpen,
  onMissionOpenChange,
  projectOpen,
  onProjectOpenChange,
  communityOpen,
  onCommunityOpenChange,
}: DashboardActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [communityQuery, setCommunityQuery] = useState("");

  const filteredCommunities = useMemo(() => {
    if (!communityQuery.trim()) return discoverCommunities;
    const q = communityQuery.toLowerCase();
    return discoverCommunities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.tag?.toLowerCase().includes(q) ?? false) ||
        (c.description?.toLowerCase().includes(q) ?? false)
    );
  }, [communityQuery, discoverCommunities]);

  const handleCreateMission = (formData: FormData) => {
    startTransition(async () => {
      const result = await createCustomDailyMission({
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || undefined,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Mission created", "success");
        onMissionOpenChange(false);
        router.refresh();
      }
    });
  };

  const handleCreateProject = (formData: FormData) => {
    startTransition(async () => {
      const result = await createProject({
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        deadline: (formData.get("deadline") as string) || undefined,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Project created", "success");
        onProjectOpenChange(false);
        router.refresh();
      }
    });
  };

  const handleJoinCommunity = (communityId: string) => {
    startTransition(async () => {
      const result = await joinCommunity(communityId);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
      else {
        toast("Joined community", "success");
        onCommunityOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="brand"
          className="rounded-2xl"
          onClick={() => onMissionOpenChange(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Mission
        </Button>
        <Button
          variant="outline"
          className="rounded-2xl"
          onClick={() => onProjectOpenChange(true)}
        >
          <FolderKanban className="h-4 w-4" aria-hidden />
          New Project
        </Button>
        <Button
          variant="outline"
          className="rounded-2xl"
          onClick={() => onCommunityOpenChange(true)}
        >
          <Compass className="h-4 w-4" aria-hidden />
          Join Community
        </Button>
      </div>

      <Modal open={missionOpen} onClose={() => onMissionOpenChange(false)} title="New mission">
        <form action={handleCreateMission} className="space-y-4">
          <div>
            <Label htmlFor="mission-title">Title</Label>
            <Input id="mission-title" name="title" required placeholder="What will you accomplish today?" />
          </div>
          <div>
            <Label htmlFor="mission-description">Description (optional)</Label>
            <Textarea
              id="mission-description"
              name="description"
              placeholder="Add details about this mission"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onMissionOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              <Zap className="h-4 w-4" aria-hidden />
              Create mission
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={projectOpen} onClose={() => onProjectOpenChange(false)} title="New project">
        <form action={handleCreateProject} className="space-y-4">
          <div>
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" name="name" required placeholder="My project" />
          </div>
          <div>
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea
              id="project-description"
              name="description"
              placeholder="What are you building?"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="project-deadline">Deadline (optional)</Label>
            <Input id="project-deadline" name="deadline" type="date" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onProjectOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              Create project
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={communityOpen}
        onClose={() => onCommunityOpenChange(false)}
        title="Join community"
      >
        <div className="space-y-4">
          <SearchField
            value={communityQuery}
            onChange={setCommunityQuery}
            placeholder="Search communities..."
            aria-label="Search communities"
          />

          {filteredCommunities.length === 0 ? (
            <EmptyState
              icon={Users}
              title={discoverCommunities.length === 0 ? "No communities to join" : "No matches found"}
              description={
                discoverCommunities.length === 0
                  ? "You have joined all available communities, or none exist yet."
                  : "Try a different search term."
              }
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {filteredCommunities.map((community) => (
                <li
                  key={community.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-fg-primary">{community.name}</p>
                      {community.tag && <Badge variant="outline">{community.tag}</Badge>}
                      {community.is_paid && <Badge variant="brand">Paid</Badge>}
                    </div>
                    {community.description && (
                      <p className="mt-1 text-caption line-clamp-2">{community.description}</p>
                    )}
                    <p className="mt-2 text-micro text-fg-faint">
                      {community.memberCount} member{community.memberCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="brand"
                    className="shrink-0 rounded-xl"
                    disabled={isPending}
                    onClick={() => handleJoinCommunity(community.id)}
                  >
                    Join
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
