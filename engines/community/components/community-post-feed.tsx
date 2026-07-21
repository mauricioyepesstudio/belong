"use client";

import { CommunityPostCard } from "./community-post-card";
import type { CommunityPostWithMeta } from "@/lib/core";
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Label,
  Textarea,
} from "@/systems/design-system";
import { MessageSquarePlus } from "lucide-react";

type CommunityPostFeedProps = {
  posts: CommunityPostWithMeta[];
  isMember: boolean;
  isPaid: boolean;
  canModerate: boolean;
  currentUserId: string;
  isPending: boolean;
  uploadingImage: boolean;
  postBody: string;
  postImageUrl: string | null;
  onPostBodyChange: (value: string) => void;
  onPostImage: (file: File | null) => void;
  onPublish: () => void;
  onJoin: () => void;
  onPostUpdate: (postId: string, updated: CommunityPostWithMeta) => void;
  onPostDelete: (postId: string) => void;
};

export function CommunityPostFeed({
  posts,
  isMember,
  isPaid,
  canModerate,
  currentUserId,
  isPending,
  uploadingImage,
  postBody,
  postImageUrl,
  onPostBodyChange,
  onPostImage,
  onPublish,
  onJoin,
  onPostUpdate,
  onPostDelete,
}: CommunityPostFeedProps) {
  return (
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
              onChange={(e) => onPostBodyChange(e.target.value)}
              rows={3}
              disabled={isPending}
            />
            {postImageUrl && (
              <p className="mt-2 text-xs text-brand">Image attached — will publish with your post</p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label htmlFor="post-image" className="sr-only">
                  Attach image
                </Label>
                <input
                  id="post-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="text-sm text-fg-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:text-brand"
                  disabled={isPending || uploadingImage}
                  onChange={(e) => onPostImage(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button disabled={isPending || !postBody.trim()} onClick={onPublish}>
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
            label: isPaid ? "Subscribe" : "Join community",
            onClick: onJoin,
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
          <div key={post.id} id={`post-${post.id}`}>
            <CommunityPostCard
              post={post}
              isMember={isMember}
              currentUserId={currentUserId}
              canModerate={canModerate}
              onPostUpdate={(updated) => onPostUpdate(post.id, updated)}
              onPostDelete={onPostDelete}
            />
          </div>
        ))
      )}
    </div>
  );
}
