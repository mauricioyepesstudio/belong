"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createNotification } from "@/lib/supabase/notify";
import { incrementWeeklyGoalByTitle } from "@/lib/engine/mission-progress";
import { recordImpactAction } from "@/engines/impact/record-action.server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackServerEvent,
} from "@/systems/analytics/track-server";

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

  const notification = await createNotification(supabase, {
    userId: recipientId,
    title: "Connection request",
    body: `${profile.full_name ?? "Someone"} wants to connect`,
    type: "connection",
    metadata: { connection_id: connection.id, requester_id: profile.id, actor_name: profile.full_name, actor_avatar_url: profile.avatar_url },
  });
  if (notification.error) {
    await supabase.from("connections").delete().eq("id", connection.id);
    return { error: "Connection request could not be sent. Please try again." };
  }

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
    const notification = await createNotification(supabase, {
      userId: connection.requester_id,
      title: "Connection accepted",
      body: `${profile.full_name ?? "Someone"} accepted your request`,
      type: "connection",
      metadata: {
        connection_id: connectionId,
        actor_id: profile.id,
        connected_user_id: profile.id,
        actor_name: profile.full_name,
        actor_avatar_url: profile.avatar_url,
      },
    });
    if (notification.error) {
      await supabase
        .from("connections")
        .update({ status: "pending" })
        .eq("id", connectionId);
      return { error: "Connection acceptance could not be completed. Please try again." };
    }
    await incrementWeeklyGoalByTitle(supabase, profile.id, "Expand your network");
    await incrementWeeklyGoalByTitle(supabase, connection.requester_id, "Expand your network");
    await recordImpactAction(supabase, {
      userId: profile.id,
      module: "system",
      eventType: "collaboration_started",
      sourceId: connectionId,
    });
    await recordImpactAction(supabase, {
      userId: connection.requester_id,
      module: "system",
      eventType: "collaboration_started",
      sourceId: connectionId,
    });
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

  const { data: acceptedConnection } = await supabase
    .from("connections")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${profile.id},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${profile.id})`
    )
    .limit(1)
    .maybeSingle();

  if (!acceptedConnection) {
    return { error: "Connect with this builder before messaging" };
  }

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

  const { data: conversationId, error: rpcError } = await supabase.rpc(
    "create_conversation_with_user",
    { p_other_user_id: otherUserId }
  );

  if (rpcError) return { error: rpcError.message };
  if (!conversationId) return { error: "Could not start conversation" };

  await trackServerEvent({
    name: "conversation_started",
    userId: profile.id,
    screen: AnalyticsScreen.COMMUNITY,
    source: AnalyticsSource.CONNECTIONS_START,
    entityId: conversationId as string,
    properties: { other_user_id: otherUserId },
  });

  revalidatePath("/messages");
  return { id: conversationId as string };
}
