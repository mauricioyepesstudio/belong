import { MessagesView } from "@/components/features/messages/messages-view";
import { getConversationMessages, getConversations } from "@/lib/data/messages";
import { requireProfile } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const profile = await requireProfile();
  const conversations = await getConversations();
  const firstId = conversations[0]?.id;
  const messages = firstId ? await getConversationMessages(firstId) : [];

  return (
    <MessagesView
      conversations={conversations}
      initialMessages={messages}
      activeConversationId={firstId}
      currentUserId={profile.id}
    />
  );
}
