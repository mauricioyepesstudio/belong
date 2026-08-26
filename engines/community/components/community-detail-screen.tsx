"use client";

import {
  addCommunityMember,
  createCommunityPost,
  joinCommunity,
  leaveCommunity,
  refreshCommunityDetail,
  removeCommunityMember,
} from "@/lib/actions/communities";
import { uploadPostImage } from "@/lib/actions/platform";
import { configurePaidCommunity } from "@/lib/actions/billing";
import { CommunityPostFeed } from "./community-post-feed";
import type { CommunityDetail, CommunityMember, CommunityPostWithMeta } from "@/lib/core";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FeatureScreen,
  Input,
  Label,
  Modal,
  Tabs,
  useToast,
} from "@/systems/design-system";
import { formatCents } from "@/engines/billing";
import { formatInitials } from "@/lib/format";
import type { CopilotPanelData } from "@/lib/data/ai-copilot";
import type { ConnectedUser } from "@/lib/data/connections";
import { SegmentErrorBoundary } from "@/components/error/segment-error-boundary";
import { CopilotPanel } from "@/engines/ai/components/copilot-panel";
import {
  dedupeById,
  fetchAuthorMeta,
  mapCommunityPostRow,
  useCommunityRealtime,
} from "@/engines/core/realtime";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackClientEvent,
} from "@/systems/analytics";
import { resolveCommunityAction } from "@/engines/community/show-up-resolver";

type CurrentUser = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

type CommunityDetailScreenProps = {
  data: CommunityDetail;
  copilot: CopilotPanelData;
  currentUser: CurrentUser;
  inviteCandidates?: ConnectedUser[];
  highlightPostId?: string | null;
};

export function CommunityDetailScreen({
  data,
  copilot,
  currentUser,
  inviteCandidates = [],
  highlightPostId = null,
}: CommunityDetailScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("feed");
  const [postBody, setPostBody] = useState("");
  const [postImageUrl, setPostImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [monetizeOpen, setMonetizeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { community, owner } = data;
  const [posts, setPosts] = useState(data.posts);
  const [membership, setMembership] = useState(data.membership);
  const [memberCount, setMemberCount] = useState(data.memberCount);
  const [members, setMembers] = useState(data.members);
  const [previousData, setPreviousData] = useState(data);
  const viewedPostRef = useRef<string | null>(null);

  if (data !== previousData) {
    setPreviousData(data);
    setPosts(data.posts);
    setMembership(data.membership);
    setMemberCount(data.memberCount);
    setMembers(data.members);
  }

  useEffect(() => {
    if (!highlightPostId) return;
    if (viewedPostRef.current === highlightPostId) return;
    setTab("feed");
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`post-${highlightPostId}`);
      el?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      if (el) {
        viewedPostRef.current = highlightPostId;
        void trackClientEvent({
          name: "post_viewed",
          userId: currentUser.id,
          screen: AnalyticsScreen.COMMUNITY_DETAIL,
          source: AnalyticsSource.COMMUNITY_FEED,
          entityId: highlightPostId,
        });
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [highlightPostId, posts.length, currentUser.id]);

  const isMember = Boolean(membership);
  const isOwner = membership?.role === "owner";
  const canModerate = membership?.role === "owner" || membership?.role === "admin";

  const syncFromServer = useCallback(async () => {
    const fresh = await refreshCommunityDetail(community.slug);
    if (!fresh) return;
    setPosts(fresh.posts);
    setMembership(fresh.membership);
    setMemberCount(fresh.memberCount);
    setMembers(fresh.members);
  }, [community.slug]);

  useCommunityRealtime({
    communityId: community.id,
    userId: currentUser.id,
    userName: currentUser.fullName,
    onPostInsert: (row) => {
      void fetchAuthorMeta(String(row.author_id)).then((author) => {
        const post = mapCommunityPostRow(row, author);
        setPosts((prev) => dedupeById(prev, post));
      });
    },
    onCommentInsert: (row) => {
      const postId = String(row.post_id);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );
    },
    onLikeInsert: (row) => {
      const postId = String(row.post_id);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likeCount: post.likeCount + 1 } : post
        )
      );
    },
    onMemberInsert: () => setMemberCount((count) => count + 1),
    onMemberDelete: () => setMemberCount((count) => Math.max(0, count - 1)),
  });

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinCommunity(community.id);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
      else {
        toast("Joined community", "success");
        setMembership({ role: "member", joinedAt: new Date().toISOString() });
        setMemberCount((count) => count + 1);
        if (!members.some((m) => m.userId === currentUser.id)) {
          const member: CommunityMember = {
            id: `temp-${currentUser.id}`,
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
      const result = await leaveCommunity(community.id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Left community", "success");
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
      const result = await createCommunityPost(community.id, postBody.trim(), postImageUrl);
      if (result.error) toast(result.error, "error");
      else if (result.post) {
        toast("Post published", "success");
        setPostBody("");
        setPostImageUrl(null);
        setPosts((prev) => [result.post!, ...prev]);
        router.refresh();
        void syncFromServer();
      }
    });
  };

  const handlePostImage = (file: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      const result = await uploadPostImage(formData);
      setUploadingImage(false);
      if (result.error) toast(result.error, "error");
      else if (result.url) {
        setPostImageUrl(result.url);
        toast("Image attached", "success");
      }
    });
  };

  const handleInviteMember = (userId: string) => {
    startTransition(async () => {
      const result = await addCommunityMember(community.id, userId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Member added", "success");
        router.refresh();
        void syncFromServer();
      }
    });
  };

  const handleRemoveMember = (userId: string) => {
    if (!confirm("Remove this member from the community?")) return;
    startTransition(async () => {
      const result = await removeCommunityMember(community.id, userId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Member removed", "success");
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
        setMemberCount((c) => Math.max(0, c - 1));
        router.refresh();
      }
    });
  };

  const handlePostUpdate = (postId: string, updated: CommunityPostWithMeta) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  };

  const handleMonetize = (formData: FormData) => {
    const price = parseFloat(formData.get("price") as string);
    const cents = Math.round(price * 100);
    startTransition(async () => {
      const result = await configurePaidCommunity(community.id, cents);
      if (result.error) toast(result.error, "error");
      else {
        toast("Paid access enabled", "success");
        setMonetizeOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <FeatureScreen
        label="Community"
        title={community.name}
        description={community.description ?? undefined}
        action={
          <Link href="/community">
            <Button variant="ghost" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All communities
            </Button>
          </Link>
        }
      >
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand-secondary/10">
                  <Users className="h-7 w-7 text-brand" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {community.tag && <Badge variant="outline">{community.tag}</Badge>}
                    {membership && (
                      <Badge
                        variant={
                          membership.role === "admin" || membership.role === "owner"
                            ? "brand"
                            : "outline"
                        }
                        className="capitalize"
                      >
                        {membership.role}
                      </Badge>
                    )}
                    {community.is_paid && community.subscription_price_cents && (
                      <Badge variant="brand">
                        {formatCents(community.subscription_price_cents)}/mo
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-caption text-fg-muted">
                    {memberCount} member{memberCount === 1 ? "" : "s"}
                    {owner && <> · Led by {owner.full_name ?? "Builder"}</>}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isMember && (
                  <Button disabled={isPending} onClick={handleJoin} className="w-full sm:w-auto">
                    {resolveCommunityAction(data, isMember, isPending).label}
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
                {isOwner && !community.is_paid && (
                  <Button
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => setMonetizeOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    Enable paid access
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isMember && (
          <SegmentErrorBoundary title="Copilot unavailable">
            <CopilotPanel
              contextType="community"
              contextId={community.id}
              slug={community.slug}
              contextName={community.name}
              canUse={copilot.canUse}
              canApply={copilot.canApply}
              recentActions={copilot.recentActions}
            />
          </SegmentErrorBoundary>
        )}

        <div className="mt-6 overflow-x-auto">
          <Tabs
            tabs={[
              { id: "feed", label: "Activity", count: posts.length },
              { id: "members", label: "Members", count: memberCount },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        {tab === "feed" ? (
          <CommunityPostFeed
            posts={posts}
            isMember={isMember}
            isPaid={Boolean(community.is_paid)}
            canModerate={canModerate}
            currentUserId={currentUser.id}
            isPending={isPending}
            uploadingImage={uploadingImage}
            postBody={postBody}
            postImageUrl={postImageUrl}
            onPostBodyChange={setPostBody}
            onPostImage={handlePostImage}
            onPublish={handlePost}
            onJoin={handleJoin}
            onPostUpdate={handlePostUpdate}
            onPostDelete={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))}
          />
        ) : (
          <div className="mt-6 space-y-4">
            {canModerate && inviteCandidates.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-3 text-sm font-medium text-fg-primary">Invite connections</p>
                  <ul className="space-y-2">
                    {inviteCandidates
                      .filter((u) => !members.some((m) => m.userId === u.id))
                      .slice(0, 6)
                      .map((user) => (
                        <li
                          key={user.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-bg-hover px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={user.avatar_url ?? undefined}
                              fallback={formatInitials(user.full_name)}
                              size="sm"
                            />
                            <span className="text-sm">{user.full_name ?? "Builder"}</span>
                          </div>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleInviteMember(user.id)}
                          >
                            Add
                          </Button>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members yet"
                description="This community is waiting for its first members."
              />
            ) : (
              <Card>
                <CardContent className="divide-y divide-border-subtle p-0 pt-2">
                  <ul>
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center gap-3 px-4 py-4 sm:px-6"
                      >
                        <Avatar
                          src={member.avatarUrl ?? undefined}
                          fallback={formatInitials(member.fullName)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-fg-primary">
                              {member.fullName ?? "Builder"}
                              {member.userId === currentUser.id && (
                                <span className="text-fg-muted"> (you)</span>
                              )}
                            </p>
                            <Badge
                              variant={
                                member.role === "admin" || member.role === "owner"
                                  ? "brand"
                                  : "outline"
                              }
                              className="capitalize"
                            >
                              {member.role}
                            </Badge>
                          </div>
                          {member.bio && (
                            <p className="mt-0.5 truncate text-caption text-fg-muted">{member.bio}</p>
                          )}
                        </div>
                        {canModerate &&
                          member.userId !== currentUser.id &&
                          member.role !== "owner" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              Remove
                            </Button>
                          )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </FeatureScreen>

      <Modal
        open={monetizeOpen}
        onClose={() => setMonetizeOpen(false)}
        title="Enable paid access"
        description="Set a monthly subscription price for your community."
      >
        <form action={handleMonetize} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Monthly price (USD)</Label>
            <Input id="price" name="price" type="number" min="5" step="0.01" required placeholder="9.99" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setMonetizeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" isLoading={isPending}>
              Enable
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
