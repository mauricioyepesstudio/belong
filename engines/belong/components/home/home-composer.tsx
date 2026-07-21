"use client";

import type { UserCommunity } from "@/lib/core";
import { createCommunityPost } from "@/lib/actions/communities";
import { uploadPostImage } from "@/lib/actions/platform";
import type { UserProfile } from "@/types/database.types";
import { Avatar, Button, useToast } from "@/systems/design-system";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { clearPostDraft, getPostDraft, setPostDraft } from "./draft-storage";
import { GlassCard } from "../dashboard/primitives";

export function HomeComposer({
  profile,
  communities,
  expanded: controlledExpanded,
  onExpandedChange,
  onNeedCommunity,
  hideHeader = false,
}: {
  profile: UserProfile;
  communities: UserCommunity[];
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onNeedCommunity?: () => void;
  hideHeader?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [communityId, setCommunityId] = useState(communities[0]?.id ?? "");
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const expanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;

  useEffect(() => {
    const draft = getPostDraft();
    if (!draft) return;
    setContent(draft.content);
    if (draft.communityId && communities.some((c) => c.id === draft.communityId)) {
      setCommunityId(draft.communityId);
    }
    if (draft.content.trim()) {
      setExpanded(true);
    }
  }, [communities, setExpanded]);

  useEffect(() => {
    if (!expanded || !content.trim()) return;
    const community = communities.find((c) => c.id === communityId);
    setPostDraft({
      content,
      communityId,
      communityName: community?.name,
      updatedAt: new Date().toISOString(),
    });
  }, [content, communityId, communities, expanded]);

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  const handleFocus = () => {
    if (communities.length === 0) {
      onNeedCommunity?.();
      return;
    }
    setExpanded(true);
  };

  const handlePublish = () => {
    if (!content.trim()) {
      toast("Write something before publishing", "error");
      return;
    }
    if (communities.length === 0) {
      onNeedCommunity?.();
      return;
    }

    startTransition(async () => {
      const result = await createCommunityPost(communityId, content.trim(), imageUrl);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast("Post published", "success");
      setContent("");
      setImageUrl(null);
      clearPostDraft();
      setExpanded(false);
      router.refresh();
    });
  };

  const handleImage = (file: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      const result = await uploadPostImage(formData);
      setUploadingImage(false);
      if (result.error) toast(result.error, "error");
      else if (result.url) {
        setImageUrl(result.url);
        toast("Image attached", "success");
      }
    });
  };

  if (communities.length === 0) {
    return (
      <section aria-labelledby="home-composer-heading">
        <div className="mb-3">
          <p className="text-label">Share</p>
          <h2 id="home-composer-heading" className="text-heading mt-1 text-fg-primary">
            Publish to your community
          </h2>
        </div>
        <GlassCard className="px-6 py-8 text-center">
          <p className="text-body text-fg-secondary">
            Join a community first — then you can share ideas, ask questions, and start
            conversations from Home.
          </p>
          <Button type="button" variant="brand" onClick={onNeedCommunity}>
            Find a community
          </Button>
        </GlassCard>
      </section>
    );
  }

  return (
    <section aria-labelledby={hideHeader ? undefined : "home-composer-heading"}>
      {!hideHeader && (
        <div className="mb-3">
          <p className="text-label">Share</p>
          <h2 id="home-composer-heading" className="text-heading mt-1 text-fg-primary">
            What do you want to share today?
          </h2>
        </div>
      )}

      <GlassCard>
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
                  Share an idea, ask a question, or invite collaborators…
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
                  <label htmlFor="home-composer-text" className="sr-only">
                    Write your post
                  </label>
                  <textarea
                    id="home-composer-text"
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your post…"
                    className="w-full resize-none rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3 text-body text-fg-primary outline-none transition-colors placeholder:text-fg-faint focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
                  />
                  {imageUrl && (
                    <p className="mt-2 text-xs text-brand">Image attached — will publish with your post</p>
                  )}
                </>
              )}
            </div>
          </div>

          {expanded && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <label htmlFor="home-composer-image" className="sr-only">
                  Attach image
                </label>
                <input
                  id="home-composer-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="text-sm text-fg-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:text-brand"
                  disabled={isPending || uploadingImage}
                  onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="ghost" onClick={() => setExpanded(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  disabled={isPending}
                  isLoading={isPending}
                  onClick={handlePublish}
                >
                  Publish post
                </Button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </section>
  );
}
