"use client";

import {
  createProjectPost,
  joinProject,
  leaveProject,
  refreshProjectDetail,
  updateProject,
} from "@/lib/actions/projects";
import { enableProjectFunding } from "@/lib/actions/billing";
import { formatCents, FundProjectModal } from "@/engines/billing";
import { ProjectPostCard } from "./project-post-card";
import { ProjectOverviewTab } from "./workspace/overview-tab";
import { ProjectActivityTab } from "./workspace/activity-tab";
import { ProjectTasksTab } from "./workspace/tasks-tab";
import { ProjectMembersTab } from "./workspace/members-tab";
import { ProjectFilesTab } from "./workspace/files-tab";
import { ProjectDiscussionsTab } from "./workspace/discussions-tab";
import { ProjectGoalsTab } from "./workspace/goals-tab";
import { ProjectAnalyticsTab } from "./workspace/analytics-tab";
import type { ProjectDetail, ProjectMember, ProjectPostWithMeta } from "@/lib/core";
import {
  Badge,
  Button,
  Card,
  CardContent,
  FeatureScreen,
  Input,
  Label,
  Modal,
  ProgressBar,
  Tabs,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { ArrowLeft, DollarSign, FolderKanban, MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { ProjectStatus } from "@/types/database.types";

type CurrentUser = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

type ProjectDetailScreenProps = {
  data: ProjectDetail;
  currentUser: CurrentUser;
};

const statusVariant: Record<ProjectStatus, "success" | "warning" | "outline" | "default"> = {
  planning: "warning",
  active: "success",
  completed: "default",
  archived: "outline",
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function ProjectDetailScreen({ data, currentUser }: ProjectDetailScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [postBody, setPostBody] = useState("");
  const [fundOpen, setFundOpen] = useState(false);
  const [backOpen, setBackOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { project, community, owner } = data;
  const [posts, setPosts] = useState(data.posts);
  const [membership, setMembership] = useState(data.membership);
  const [memberCount, setMemberCount] = useState(data.memberCount);
  const [members, setMembers] = useState(data.members);
  const [workspace, setWorkspace] = useState(data.workspace);
  const [status, setStatus] = useState(project.status);
  const [fundingEnabled, setFundingEnabled] = useState(project.funding_enabled);

  useEffect(() => {
    setPosts(data.posts);
    setMembership(data.membership);
    setMemberCount(data.memberCount);
    setMembers(data.members);
    setWorkspace(data.workspace);
    setStatus(data.project.status);
    setFundingEnabled(data.project.funding_enabled);
  }, [data]);

  const isMember = Boolean(membership);
  const isOwner = project.owner_id === currentUser.id;
  const isAdmin = membership?.role === "admin" || isOwner;

  const fundingProgress =
    project.funding_goal_cents && project.funding_goal_cents > 0
      ? Math.min(
          100,
          Math.round(((project.funding_raised_cents ?? 0) / project.funding_goal_cents) * 100)
        )
      : 0;

  const syncFromServer = useCallback(async () => {
    const fresh = await refreshProjectDetail(project.id);
    if (!fresh) return;
    setPosts(fresh.posts);
    setMembership(fresh.membership);
    setMemberCount(fresh.memberCount);
    setMembers(fresh.members);
    setWorkspace(fresh.workspace);
    setStatus(fresh.project.status);
    setFundingEnabled(fresh.project.funding_enabled);
  }, [project.id]);

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinProject(project.id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Joined project", "success");
        setMembership({ role: "member", joinedAt: new Date().toISOString() });
        setMemberCount((count) => count + 1);
        if (!members.some((m) => m.userId === currentUser.id)) {
          const member: ProjectMember = {
            key: `temp-${currentUser.id}`,
            userId: currentUser.id,
            role: "member",
            joinedAt: new Date().toISOString(),
            fullName: currentUser.fullName,
            avatarUrl: currentUser.avatarUrl,
            bio: null,
          };
          setMembers((prev) => [...prev, member]);
        }
        router.refresh();
        void syncFromServer();
      }
    });
  };

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveProject(project.id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Left project", "success");
        setMembership(null);
        setMemberCount((count) => Math.max(0, count - 1));
        setMembers((prev) => prev.filter((m) => m.userId !== currentUser.id));
        router.refresh();
        void syncFromServer();
      }
    });
  };

  const handlePost = () => {
    if (!postBody.trim()) return;
    startTransition(async () => {
      const result = await createProjectPost(project.id, postBody.trim());
      if (result.error) toast(result.error, "error");
      else if (result.post) {
        toast("Update published", "success");
        setPostBody("");
        setPosts((prev) => [result.post!, ...prev]);
        router.refresh();
        void syncFromServer();
      }
    });
  };

  const handlePostUpdate = (postId: string, updated: ProjectPostWithMeta) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  };

  const handleStatusChange = (nextStatus: ProjectStatus) => {
    if (!isOwner) return;
    const previousStatus = status;
    setStatus(nextStatus);
    startTransition(async () => {
      const result = await updateProject(project.id, { status: nextStatus });
      if (result.error) {
        toast(result.error, "error");
        setStatus(previousStatus);
      } else {
        toast("Status updated", "success");
        router.refresh();
      }
    });
  };

  const handleEnableFunding = (formData: FormData) => {
    const goal = parseFloat(formData.get("goal") as string);
    if (Number.isNaN(goal) || goal < 5) {
      toast("Enter a valid funding goal of at least $5", "error");
      return;
    }
    const cents = Math.round(goal * 100);
    startTransition(async () => {
      const result = await enableProjectFunding(project.id, cents);
      if (result.error) toast(result.error, "error");
      else {
        toast("Funding enabled", "success");
        setFundOpen(false);
        setFundingEnabled(true);
        router.refresh();
        void syncFromServer();
      }
    });
  };

  return (
    <>
      <FeatureScreen
        label="Project"
        title={project.name}
        description={project.description ?? undefined}
        action={
          <Link href="/projects">
            <Button variant="ghost" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All projects
            </Button>
          </Link>
        }
      >
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand-secondary/10">
                  <FolderKanban className="h-7 w-7 text-brand" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant[status]} className="capitalize">
                      {status}
                    </Badge>
                    {membership && (
                      <Badge
                        variant={membership.role === "owner" ? "brand" : "outline"}
                        className="capitalize"
                      >
                        {membership.role}
                      </Badge>
                    )}
                    {fundingEnabled && <Badge variant="brand">Funding</Badge>}
                    <Link href={`/community/${community.slug}`}>
                      <Badge variant="outline">{community.name}</Badge>
                    </Link>
                  </div>
                  <p className="mt-2 text-caption text-fg-muted">
                    {memberCount} member{memberCount === 1 ? "" : "s"}
                    {owner && <> · Owned by {owner.full_name ?? "Builder"}</>}
                    {project.deadline && (
                      <> · Due {new Date(project.deadline).toLocaleDateString()}</>
                    )}
                  </p>
                  <div className="mt-3 max-w-xs space-y-1">
                    <div className="flex justify-between text-xs text-fg-muted">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <ProgressBar value={project.progress} animate={false} />
                  </div>
                  {fundingEnabled && project.funding_goal_cents && (
                    <div className="mt-3 max-w-xs space-y-1">
                      <div className="flex justify-between text-xs text-fg-muted">
                        <span>Raised {formatCents(project.funding_raised_cents ?? 0)}</span>
                        <span>Goal {formatCents(project.funding_goal_cents)}</span>
                      </div>
                      <ProgressBar value={fundingProgress} animate={false} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                {isOwner && (
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={status === option.value ? "brand" : "secondary"}
                        disabled={isPending}
                        onClick={() => handleStatusChange(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {!isMember && (
                    <Button disabled={isPending} onClick={handleJoin} className="w-full sm:w-auto">
                      Join project
                    </Button>
                  )}
                  {isMember && !isOwner && (
                    <Button
                      variant="secondary"
                      disabled={isPending}
                      onClick={handleLeave}
                      className="w-full sm:w-auto"
                    >
                      Leave
                    </Button>
                  )}
                  {isOwner && !fundingEnabled && (
                    <Button
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => setFundOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      Enable funding
                    </Button>
                  )}
                  {!isOwner && fundingEnabled && (
                    <Button
                      variant="brand"
                      disabled={isPending}
                      onClick={() => setBackOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <DollarSign className="h-4 w-4" aria-hidden />
                      Back project
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 overflow-x-auto">
          <Tabs
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "activity", label: "Activity", count: workspace.activity.length + posts.length },
              { id: "tasks", label: "Tasks", count: workspace.tasks.length },
              { id: "members", label: "Members", count: memberCount },
              { id: "files", label: "Files", count: workspace.files.length },
              { id: "discussions", label: "Discussions", count: workspace.discussions.length },
              { id: "goals", label: "Goals", count: workspace.goals.length },
              { id: "analytics", label: "Analytics" },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        {tab === "overview" && <ProjectOverviewTab data={{ ...data, workspace }} />}

        {tab === "activity" && (
          <div className="space-y-6">
            <ProjectActivityTab activity={workspace.activity} postsCount={posts.length} />
            {isMember && (
              <Card>
                <CardContent className="pt-6">
                  <Label htmlFor="project-post-content" className="sr-only">
                    Write an update
                  </Label>
                  <Textarea
                    id="project-post-content"
                    placeholder="Share a project update..."
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    rows={3}
                    disabled={isPending}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button disabled={isPending || !postBody.trim()} onClick={handlePost}>
                      <MessageSquarePlus className="h-4 w-4" aria-hidden />
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {posts.map((post) => (
              <ProjectPostCard
                key={post.id}
                post={post}
                isMember={isMember}
                onPostUpdate={(updated) => handlePostUpdate(post.id, updated)}
              />
            ))}
          </div>
        )}

        {tab === "tasks" && (
          <ProjectTasksTab
            projectId={project.id}
            tasks={workspace.tasks}
            isMember={isMember}
          />
        )}

        {tab === "members" && (
          <ProjectMembersTab
            projectId={project.id}
            members={members}
            currentUserId={currentUser.id}
            isOwner={isOwner}
            isAdmin={isAdmin}
          />
        )}

        {tab === "files" && (
          <ProjectFilesTab
            projectId={project.id}
            files={workspace.files}
            isMember={isMember}
          />
        )}

        {tab === "discussions" && (
          <ProjectDiscussionsTab
            projectId={project.id}
            discussions={workspace.discussions}
            isMember={isMember}
          />
        )}

        {tab === "goals" && (
          <ProjectGoalsTab
            projectId={project.id}
            goals={workspace.goals}
            isMember={isMember}
          />
        )}

        {tab === "analytics" && <ProjectAnalyticsTab analytics={workspace.analytics} />}
      </FeatureScreen>

      <Modal
        open={fundOpen}
        onClose={() => setFundOpen(false)}
        title="Enable project funding"
        description="Set a funding goal and accept contributions via Stripe."
      >
        <form action={handleEnableFunding} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="detail-funding-goal">Funding goal (USD)</Label>
            <Input
              id="detail-funding-goal"
              name="goal"
              type="number"
              min="5"
              step="1"
              required
              placeholder="1000"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFundOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" isLoading={isPending}>
              Enable
            </Button>
          </div>
        </form>
      </Modal>

      <FundProjectModal
        open={backOpen}
        onClose={() => setBackOpen(false)}
        project={project}
      />
    </>
  );
}
