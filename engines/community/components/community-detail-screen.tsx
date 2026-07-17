"use client";

import {
  createCommunityPost,
  joinCommunity,
  leaveCommunity,
  refreshCommunityDetail,
} from "@/lib/actions/communities";
import { configurePaidCommunity } from "@/lib/actions/billing";
import { CommunityPostCard } from "./community-post-card";
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
  Textarea,
  useToast,
} from "@/systems/design-system";
import { formatCents } from "@/engines/billing";
import { formatInitials } from "@/lib/format";
import { ArrowLeft, MessageSquarePlus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type CurrentUser = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

type CommunityDetailScreenProps = {
  data: CommunityDetail;
  currentUser: CurrentUser;
};

export function CommunityDetailScreen({ data, currentUser }: CommunityDetailScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("feed");
  const [postBody, setPostBody] = useState("");
  const [monetizeOpen, setMonetizeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { community, owner } = data;
  const [posts, setPosts] = useState(data.posts);
  const [membership, setMembership] = useState(data.membership);
  const [memberCount, setMemberCount] = useState(data.memberCount);
  const [members, setMembers] = useState(data.members);

  useEffect(() => {
    setPosts(data.posts);
    setMembership(data.membership);
    setMemberCount(data.memberCount);
    setMembers(data.members);
  }, [data]);

  const isMember = Boolean(membership);
  const isOwner = membership?.role === "owner";

  const syncFromServer = useCallback(async () => {
    const fresh = await refreshCommunityDetail(community.slug);
    if (!fresh) return;
    setPosts(fresh.posts);
    setMembership(fresh.membership);
    setMemberCount(fresh.memberCount);
    setMembers(fresh.members);
  }, [community.slug]);

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
      const result = await createCommunityPost(community.id, postBody.trim());
      if (result.error) toast(result.error, "error");
      else if (result.post) {
        toast("Post published", "success");
        setPostBody("");
        setPosts((prev) => [result.post!, ...prev]);
        router.refresh();
        void syncFromServer();
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
                    {community.is_paid ? "Subscribe" : "Join community"}
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
          <div className="mt-6 space-y-4">
            {isMember ? (
              <Card>
                <CardContent className="pt-6">
                  <Label htmlFor="post-content" className="sr-only">
                    Write a post
                  </Label>
                  <Textarea
                    id="post-content"
                    placeholder="Share an update with your community..."
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
            ) : (
              <EmptyState
                icon={MessageSquarePlus}
                title="Join to participate"
                description="Become a member to post, comment, and like in this community."
                action={{
                  label: community.is_paid ? "Subscribe" : "Join community",
                  onClick: handleJoin,
                }}
                className="py-10"
              />
            )}

            {posts.length === 0 ? (
              <EmptyState
                icon={MessageSquarePlus}
                title="No activity yet"
                description={
                  isMember
                    ? "Be the first to share something with this community."
                    : "This community has not had any posts yet."
                }
              />
            ) : (
              posts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  isMember={isMember}
                  onPostUpdate={(updated) => handlePostUpdate(post.id, updated)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="mt-6">
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
