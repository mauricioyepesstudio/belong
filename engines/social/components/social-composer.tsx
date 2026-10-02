"use client";

import {
  createSocialPost,
  deleteSocialPostMedia,
} from "@/lib/actions/social";
import type { SocialPostType, SocialPublishingContext } from "@/engines/social";
import { classifySocialMedia, socialMediaExtension } from "@/engines/social/media";
import { createClient } from "@/lib/supabase/client";
import { Avatar, Button, Textarea, useToast } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import {
  CircleHelp,
  FolderKanban,
  ImageIcon,
  Lightbulb,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

const choices: Array<{
  type: SocialPostType;
  label: string;
  icon: typeof ImageIcon;
  accept?: string;
}> = [
  { type: "PHOTO", label: "Photo", icon: ImageIcon, accept: "image/jpeg,image/png,image/webp,image/gif" },
  { type: "VIDEO", label: "Video", icon: Video, accept: "video/mp4,video/webm,video/quicktime" },
  { type: "TEXT", label: "Thought", icon: Lightbulb },
  { type: "PROJECT_UPDATE", label: "Project update", icon: FolderKanban },
  { type: "COMMUNITY_UPDATE", label: "Community update", icon: Users },
  { type: "NEEDS_HELP", label: "Need help", icon: CircleHelp },
  { type: "IMPACT", label: "Impact", icon: Sparkles },
];

export function SocialComposer({
  viewer,
  contexts,
  defaultContext,
  onPublished,
}: {
  viewer: { id: string; fullName: string | null; avatarUrl: string | null };
  contexts: SocialPublishingContext[];
  defaultContext?: SocialPublishingContext | null;
  onPublished?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [type, setType] = useState<SocialPostType>("TEXT");
  const [contextKey, setContextKey] = useState(
    defaultContext ? `${defaultContext.type}:${defaultContext.id}` : ""
  );
  const [media, setMedia] = useState<{
    url: string;
    path: string;
    type: "image" | "video";
    mimeType: string;
    sizeBytes: number;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectType = (next: (typeof choices)[number]) => {
    setExpanded(true);
    setType(next.type);
    if (next.accept) {
      inputRef.current?.setAttribute("accept", next.accept);
      inputRef.current?.click();
    }
  };

  const upload = async (file: File | null) => {
    if (!file) return;
    const classification = classifySocialMedia(file);
    if (!classification) {
      toast("Unsupported image or video type", "error");
      return;
    }
    if (file.size > classification.maxBytes) {
      toast(classification.type === "image" ? "Image must be under 5MB" : "Video must be under 50MB", "error");
      return;
    }

    setUploading(true);
    try {
      // Upload binary bytes directly to Storage. Sending the File through a
      // Server Action hits Next's 1MB request parser before BELONG validation.
      const supabase = createClient();
      const extension = socialMediaExtension(file.name, file.type);
      const path = `${viewer.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("post-media").upload(path, file, {
        upsert: false,
        contentType: file.type,
        cacheControl: "3600",
      });
      if (error) {
        toast("Could not upload media. Please try again.", "error");
        return;
      }
      const { data, error: signedUrlError } = await supabase.storage
        .from("post-media")
        .createSignedUrl(path, 15 * 60);
      if (signedUrlError || !data?.signedUrl) {
        await supabase.storage.from("post-media").remove([path]);
        toast("Could not prepare the uploaded media. Please try again.", "error");
        return;
      }
      setMedia({
        url: data.signedUrl,
        path,
        type: classification.type,
        mimeType: file.type,
        sizeBytes: file.size,
        name: file.name,
      });
      toast("Media attached", "success");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const publish = () => {
    if (!body.trim() && !media) {
      toast("Add something to share", "error");
      return;
    }
    const [contextType, contextId] = contextKey.split(":");
    startTransition(async () => {
      const result = await createSocialPost({
        type,
        body: body.trim(),
        media,
        communityId: contextType === "community" ? contextId : null,
        projectId: contextType === "project" ? contextId : null,
      });
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      setBody("");
      setMedia(null);
      setType("TEXT");
      setExpanded(false);
      toast("Your post is live", "success");
      onPublished?.();
      router.refresh();
    });
  };

  const removeMedia = () => {
    if (!media) return;
    const removed = media;
    setMedia(null);
    startTransition(async () => {
      const result = await deleteSocialPostMedia(removed.path);
      if (result.error) {
        setMedia(removed);
        toast(result.error, "error");
      }
    });
  };

  const cancel = () => {
    if (media) {
      removeMedia();
    }
    setExpanded(false);
  };

  return (
    <section className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_rgba(255,255,255,.05)] sm:p-5">
      <div className="flex min-w-0 gap-3">
        <Avatar
          src={viewer.avatarUrl ?? undefined}
          fallback={formatInitials(viewer.fullName)}
          size="md"
        />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-white/8 bg-black/15 px-4 text-left text-sm text-fg-muted transition hover:border-brand/30 hover:text-fg-secondary"
        >
          What&apos;s happening in your world?
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <Textarea
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share what matters, invite collaboration, or ask for support..."
            className="min-h-28 resize-y"
          />
          {contexts.length > 0 && (
            <select
              value={contextKey}
              onChange={(event) => setContextKey(event.target.value)}
              aria-label="Post destination"
              className="min-h-11 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-sm text-fg-primary"
            >
              <option value="">Your profile and BELONG feed</option>
              {contexts.map((context) => (
                <option key={`${context.type}:${context.id}`} value={`${context.type}:${context.id}`}>
                  {context.type === "community" ? "Community" : "Project"} · {context.name}
                </option>
              ))}
            </select>
          )}
          {media && (
            <div className="overflow-hidden rounded-xl border border-brand/20 bg-brand/5">
              <div className="relative bg-black/20">
                {media.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.url}
                    alt=""
                    className="max-h-40 w-full object-contain"
                  />
                ) : (
                  <video
                    src={media.url}
                    controls
                    preload="metadata"
                    className="max-h-40 w-full"
                  />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  aria-label="Remove attachment"
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80 focus-ring"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="truncate px-3 py-2 text-xs text-fg-muted">{media.name}</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => void upload(event.target.files?.[0] ?? null)}
      />

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {choices.slice(0, expanded ? choices.length : 5).map((choice) => {
          const Icon = choice.icon;
          return (
            <button
              key={choice.label}
              type="button"
              disabled={pending || uploading}
              onClick={() => selectType(choice)}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${
                type === choice.type && expanded
                  ? "border-brand/35 bg-brand/12 text-brand"
                  : "border-white/8 bg-white/[0.025] text-fg-muted hover:text-fg-primary"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {choice.label}
            </button>
          );
        })}
      </div>

      {expanded && (
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={cancel}>
            Cancel
          </Button>
          <Button
            variant="brand"
            disabled={pending || uploading || (!body.trim() && !media)}
            isLoading={pending || uploading}
            onClick={publish}
          >
            Publish
          </Button>
        </div>
      )}
    </section>
  );
}
