"use client";

import type { ProjectDiscussion } from "@/lib/core/project-workspace";
import {
  createProjectDiscussion,
  replyToProjectDiscussion,
} from "@/lib/actions/project-workspace";
import { TypingIndicator, useTypingIndicator } from "@/engines/core/realtime";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Label,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { formatInitials, formatDistanceToNow } from "@/lib/format";
import { MessageSquare } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

export function ProjectDiscussionsTab({
  projectId,
  discussions: initial,
  isMember,
  currentUserId,
  currentUserName,
}: {
  projectId: string;
  discussions: ProjectDiscussion[];
  isMember: boolean;
  currentUserId: string;
  currentUserName: string | null;
}) {
  const { toast } = useToast();
  const [discussions, setDiscussions] = useState(initial);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeDiscussionId, setActiveDiscussionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { typingUsers, broadcastTyping } = useTypingIndicator({
    discussionId: activeDiscussionId ?? "",
    userId: currentUserId,
    fullName: currentUserName,
  });

  useEffect(() => {
    setDiscussions(initial);
  }, [initial]);

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    const draftTitle = title.trim();
    const draftContent = content.trim();
    startTransition(async () => {
      const result = await createProjectDiscussion(projectId, {
        title: draftTitle,
        content: draftContent,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Discussion started", "success");
        setTitle("");
        setContent("");
        if (result.discussionId) {
          setDiscussions((prev) => [
            {
              id: result.discussionId!,
              projectId,
              authorId: currentUserId,
              title: draftTitle,
              content: draftContent,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              authorName: currentUserName,
              authorAvatar: null,
              replyCount: 0,
              replies: [],
            },
            ...prev,
          ]);
        }
      }
    });
  };

  const handleReply = (discussionId: string) => {
    const text = replyDrafts[discussionId]?.trim();
    if (!text) return;
    startTransition(async () => {
      const result = await replyToProjectDiscussion(discussionId, text);
      if (result.error) toast(result.error, "error");
      else {
        toast("Reply posted", "success");
        setReplyDrafts((d) => ({ ...d, [discussionId]: "" }));
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === discussionId
              ? {
                  ...d,
                  replyCount: d.replyCount + 1,
                  replies: [
                    ...d.replies,
                    {
                      id: `temp-${Date.now()}`,
                      discussionId,
                      authorId: currentUserId,
                      parentReplyId: null,
                      content: text,
                      createdAt: new Date().toISOString(),
                      authorName: currentUserName,
                      authorAvatar: null,
                    },
                  ],
                }
              : d
          )
        );
      }
    });
  };

  if (!isMember) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Join to discuss"
        description="Start threaded discussions with your project team."
        className="mt-6 py-10"
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div>
            <Label htmlFor="disc-title">New discussion</Label>
            <Input
              id="disc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Topic title"
              disabled={isPending}
            />
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start the conversation..."
            rows={3}
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button
              disabled={isPending || !title.trim() || !content.trim()}
              onClick={handleCreate}
            >
              Start discussion
            </Button>
          </div>
        </CardContent>
      </Card>

      {discussions.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No discussions yet" description="Open a thread to align the team." />
      ) : (
        discussions.map((d) => (
          <Card key={d.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Avatar
                  src={d.authorAvatar ?? undefined}
                  fallback={formatInitials(d.authorName)}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg-primary">{d.title}</p>
                  <p className="mt-1 text-body text-fg-secondary">{d.content}</p>
                  <p className="mt-1 text-micro text-fg-faint">
                    {d.authorName} · {formatDistanceToNow(d.createdAt)}
                  </p>
                </div>
              </div>

              {d.replies.length > 0 && (
                <ul className="mt-4 space-y-3 border-l-2 border-border-subtle pl-4">
                  {d.replies.map((r) => (
                    <li key={r.id} className={r.parentReplyId ? "ml-4" : ""}>
                      <p className="text-sm text-fg-primary">{r.content}</p>
                      <p className="text-micro text-fg-faint">
                        {r.authorName} · {formatDistanceToNow(r.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {activeDiscussionId === d.id && (
                <TypingIndicator users={typingUsers} className="mt-3" />
              )}

              <div className="mt-4 flex gap-2">
                <Input
                  value={replyDrafts[d.id] ?? ""}
                  onFocus={() => setActiveDiscussionId(d.id)}
                  onChange={(e) => {
                    setReplyDrafts((prev) => ({ ...prev, [d.id]: e.target.value }));
                    setActiveDiscussionId(d.id);
                    broadcastTyping();
                  }}
                  placeholder="Reply..."
                  disabled={isPending}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending || !replyDrafts[d.id]?.trim()}
                  onClick={() => handleReply(d.id)}
                >
                  Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
