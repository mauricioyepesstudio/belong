"use client";

import { ProjectPostCard } from "./project-post-card";
import type { ProjectPostWithMeta } from "@/lib/core";
import { Button, Card, CardContent, Label, Textarea } from "@/systems/design-system";
import { MessageSquarePlus } from "lucide-react";

type ProjectPostFeedProps = {
  posts: ProjectPostWithMeta[];
  isMember: boolean;
  isOwner: boolean;
  currentUserId: string;
  isPending: boolean;
  uploadingImage: boolean;
  postBody: string;
  postImageUrl: string | null;
  onPostBodyChange: (value: string) => void;
  onPostImage: (file: File | null) => void;
  onPublish: () => void;
  onPostUpdate: (postId: string, updated: ProjectPostWithMeta) => void;
  onPostDelete: (postId: string) => void;
};

export function ProjectPostFeed({
  posts,
  isMember,
  isOwner,
  currentUserId,
  isPending,
  uploadingImage,
  postBody,
  postImageUrl,
  onPostBodyChange,
  onPostImage,
  onPublish,
  onPostUpdate,
  onPostDelete,
}: ProjectPostFeedProps) {
  return (
    <div className="space-y-4">
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
              onChange={(e) => onPostBodyChange(e.target.value)}
              rows={3}
              disabled={isPending}
            />
            {postImageUrl && (
              <p className="mt-2 text-xs text-brand">Image attached — will publish with your post</p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label htmlFor="project-post-image" className="sr-only">
                  Attach image
                </Label>
                <input
                  id="project-post-image"
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
      )}
      {posts.map((post) => (
        <div
          key={post.id}
          id={`post-${post.id}`}
          tabIndex={-1}
          className="scroll-mt-24 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
          aria-label={`Project update by ${post.author.fullName ?? "Builder"}`}
        >
          <ProjectPostCard
            post={post}
            isMember={isMember}
            currentUserId={currentUserId}
            canModerate={isOwner}
            onPostUpdate={(updated) => onPostUpdate(post.id, updated)}
            onPostDelete={onPostDelete}
          />
        </div>
      ))}
    </div>
  );
}
