"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createNotification } from "@/lib/supabase/notify";
import type { Message } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!participant) return [];

  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  await markConversationRead(conversationId);

  return data ?? [];
}

export async function sendMessage(
  conversationId: string,
  body: string
): Promise<ActionResult & { message?: Message }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmed = body.trim();
  if (!trimmed) return { error: "Message cannot be empty" };

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!participant) return { error: "Not a participant" };

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      body: trimmed,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  const { data: others } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", profile.id);

  for (const other of others ?? []) {
    await createNotification(supabase, {
      userId: other.user_id,
      title: "New message",
      body: trimmed.slice(0, 120),
      type: "message",
      metadata: { conversation_id: conversationId, message_id: message.id },
    });
  }

  revalidatePath("/messages");
  revalidatePath("/", "layout");
  return { message };
}

export async function markConversationRead(conversationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", profile.id)
    .is("read_at", null);

  revalidatePath("/messages");
  revalidatePath("/", "layout");
  return {};
}
