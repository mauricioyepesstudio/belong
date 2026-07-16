import type { UserProfile } from "@/types/database.types";
import type { SupabaseServerClient } from "./types";

export type ConversationPreview = {
  id: string;
  name: string;
  avatarUrl: string | null;
  preview: string;
  time: string;
  unread: boolean;
  otherUserId?: string;
};

export async function fetchConversationPreviews(
  supabase: SupabaseServerClient,
  userId: string,
  limit?: number
): Promise<ConversationPreview[]> {
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  const ids = (participations ?? []).map((p) => p.conversation_id);
  if (!ids.length) return [];

  const results = await Promise.all(
    ids.map(async (conversationId) => {
      const [{ data: messages }, { data: participants }] = await Promise.all([
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conversationId),
      ]);

      const otherUserId = (participants ?? [])
        .map((p) => p.user_id)
        .find((id) => id !== userId);

      let otherUser: Pick<UserProfile, "id" | "full_name" | "avatar_url"> | null =
        null;
      if (otherUserId) {
        const { data } = await supabase
          .from("users")
          .select("id, full_name, avatar_url")
          .eq("id", otherUserId)
          .single();
        otherUser = data;
      }

      const lastMessage = messages?.[0];
      const unread = lastMessage
        ? lastMessage.sender_id !== userId && !lastMessage.read_at
        : false;

      return {
        id: conversationId,
        name: otherUser?.full_name ?? "Conversation",
        avatarUrl: otherUser?.avatar_url ?? null,
        preview: lastMessage?.body ?? "No messages yet",
        time: lastMessage?.created_at ?? "",
        unread,
        otherUserId: otherUser?.id,
      };
    })
  );

  const sorted = results.sort(
    (a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()
  );

  return limit ? sorted.slice(0, limit) : sorted;
}
