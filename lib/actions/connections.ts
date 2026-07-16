"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createNotification } from "@/lib/supabase/notify";
import { incrementWeeklyGoalByTitle } from "@/lib/engine/mission-progress";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";

export type ConnectionRequest = {
  id: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
  createdAt: string;
};

export async function sendConnectionRequest(recipientId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (recipientId === profile.id) return { error: "Cannot connect with yourself" };

  const { data: existing } = await supabase
    .from("connections")
    .select("id, status")
    .or(
      `and(requester_id.eq.${profile.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${profile.id})`
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") return { error: "Already connected" };
    if (existing.status === "pending") return { error: "Request already pending" };
  }

  const { data: connection, error } = await supabase
    .from("connections")
    .insert({
      requester_id: profile.id,
      recipient_id: recipientId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await createNotification(supabase, {
    userId: recipientId,
    title: "Connection request",
    body: `${profile.full_name ?? "Someone"} wants to connect`,
    type: "connection",
    metadata: { connection_id: connection.id, requester_id: profile.id },
  });

  revalidatePath("/community");
  revalidatePath("/", "layout");
  return { id: connection.id };
}

export async function respondToConnection(
  connectionId: string,
  accept: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: connection } = await supabase
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (!connection || connection.recipient_id !== profile.id) {
    return { error: "Not authorized" };
  }

  const status = accept ? "accepted" : "declined";

  const { error } = await supabase
    .from("connections")
    .update({ status })
    .eq("id", connectionId);

  if (error) return { error: error.message };

  if (accept) {
    await createNotification(supabase, {
      userId: connection.requester_id,
      title: "Connection accepted",
      body: `${profile.full_name ?? "Someone"} accepted your request`,
      type: "connection",
      metadata: { connection_id: connectionId },
    });
    await incrementWeeklyGoalByTitle(supabase, profile.id, "Expand your network");
    await incrementWeeklyGoalByTitle(supabase, connection.requester_id, "Expand your network");
  }

  revalidatePath("/community");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return {};
}

export async function startConversation(otherUserId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (otherUserId === profile.id) return { error: "Invalid user" };

  const { data: myConversations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", profile.id);

  const myIds = (myConversations ?? []).map((c) => c.conversation_id);

  if (myIds.length) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myIds)
      .limit(1)
      .maybeSingle();

    if (shared) return { id: shared.conversation_id };
  }

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (convError) return { error: convError.message };

  const { error: partError } = await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: profile.id },
    { conversation_id: conversation.id, user_id: otherUserId },
  ]);

  if (partError) return { error: partError.message };

  revalidatePath("/messages");
  return { id: conversation.id };
}
