import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { fetchConversationPreviews } from "@/lib/core";

export type { ConversationPreview } from "@/lib/core";

export async function getConversations() {
  const supabase = await createClient();
  const profile = await requireProfile();
  return fetchConversationPreviews(supabase, profile.id);
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return data ?? [];
}
