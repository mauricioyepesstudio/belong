"use client";

import { fetchMessages, sendMessage } from "@/lib/actions/messages";
import { FeatureScreen, Avatar, Button, Card, CardContent, EmptyState, Input } from "@/systems/design-system";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/database.types";
import { MessageSquare, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type ConversationItem = {
  id: string;
  name: string;
  avatarUrl: string | null;
  preview: string;
  time: string;
  unread: boolean;
};

type MessagesViewProps = {
  conversations: ConversationItem[];
  initialMessages: Message[];
  activeConversationId?: string;
  currentUserId: string;
};

export function MessagesView({
  conversations,
  initialMessages,
  activeConversationId,
  currentUserId,
}: MessagesViewProps) {
  const [active, setActive] = useState(activeConversationId ?? conversations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => conversations.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [conversations, query]
  );

  const selected = conversations.find((c) => c.id === active);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    const data = await fetchMessages(conversationId);
    setMessages(data);
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (active) loadMessages(active);
  }, [active, loadMessages]);

  const onRealtimeMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    },
    []
  );

  useRealtimeMessages(active || null, onRealtimeMessage);

  const handleSend = () => {
    if (!body.trim() || !active) return;
    startTransition(async () => {
      const result = await sendMessage(active, body.trim());
      if (!result.error && result.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.message!.id)) return prev;
          return [...prev, result.message!];
        });
        setBody("");
      }
    });
  };

  return (
    <FeatureScreen
      label="Messages"
      title="Messages"
      description="Stay connected with your builders."
    >
      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Connect with builders from the Community page to start messaging."
          action={{ label: "Find people", href: "/community" }}
        />
      ) : (
        <div className="grid h-[calc(100vh-280px)] min-h-[480px] gap-0 overflow-hidden rounded-2xl border border-border lg:grid-cols-5">
          <div className="border-b border-border-subtle lg:col-span-2 lg:border-b-0 lg:border-r">
            <div className="border-b border-border-subtle p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" aria-hidden />
                <Input
                  className="pl-10"
                  placeholder="Search messages..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search messages"
                />
              </div>
            </div>
            <div className="overflow-y-auto" role="list">
              {filtered.map((convo) => (
                <button
                  key={convo.id}
                  type="button"
                  role="listitem"
                  onClick={() => setActive(convo.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3.5 text-left transition-colors hover:bg-bg-hover",
                    active === convo.id && "bg-bg-active",
                    convo.unread && "bg-brand/5"
                  )}
                >
                  <Avatar
                    fallback={formatInitials(convo.name)}
                    size="sm"
                    className="rounded-lg"
                    src={convo.avatarUrl ?? undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={cn("truncate text-sm", convo.unread ? "font-semibold" : "text-fg-secondary")}>
                        {convo.name}
                      </p>
                      {convo.time && (
                        <span className="text-[11px] text-fg-faint">
                          {formatDistanceToNow(convo.time)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-fg-muted">{convo.preview}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Card className="hidden rounded-none border-0 lg:col-span-3 lg:flex lg:flex-col">
            {selected ? (
              <>
                <div className="flex items-center gap-3 border-b border-border-subtle p-4">
                  <Avatar
                    fallback={formatInitials(selected.name)}
                    size="sm"
                    src={selected.avatarUrl ?? undefined}
                  />
                  <p className="text-sm font-semibold">{selected.name}</p>
                </div>
                <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                  {loadingMessages ? (
                    <p className="text-caption">Loading messages...</p>
                  ) : (
                    messages.map((m) => {
                      const isOwn = m.sender_id === currentUserId;
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                            isOwn
                              ? "ml-auto bg-brand text-white"
                              : "bg-bg-surface text-fg-secondary"
                          )}
                        >
                          {m.body}
                        </div>
                      );
                    })
                  )}
                </CardContent>
                <div className="flex gap-2 border-t border-border-subtle p-4">
                  <Input
                    placeholder="Type a message..."
                    className="flex-1"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    aria-label="Message input"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={isPending || !body.trim()}>
                    Send
                  </Button>
                </div>
              </>
            ) : (
              <CardContent className="flex flex-1 items-center justify-center">
                <p className="text-caption">Select a conversation</p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </FeatureScreen>
  );
}
