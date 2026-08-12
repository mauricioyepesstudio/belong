import { MessagesView } from "@/components/features/messages/messages-view";
import { getConversationMessages, getConversations } from "@/lib/data/messages";
import { requireProfile } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Messages" };

type MessagesPageProps = {
  searchParams: Promise<{ conversation?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const profile = await requireProfile();
  const { conversation: conversationParam } = await searchParams;
  const conversations = await getConversations();
  const activeId =
    conversationParam && conversations.some((c) => c.id === conversationParam)
      ? conversationParam
      : conversations[0]?.id;
  const messages = activeId ? await getConversationMessages(activeId) : [];

  return (
    <MessagesView
      key={activeId ?? "no-conversation"}
      conversations={conversations}
      initialMessages={messages}
      activeConversationId={activeId}
      currentUserId={profile.id}
    />
  );
}
