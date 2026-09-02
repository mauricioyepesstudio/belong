"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import { toUserErrorMessage } from "@/lib/errors/user-message";
import { canCancel, canConfirm, canDecline, canPropose } from "@/engines/impact";

function revalidateCollaborationSurfaces(...userIds: Array<string | undefined>) {
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  for (const id of userIds) {
    if (id) revalidatePath(`/people/${id}`);
  }
}

export async function proposeCollaboration(
  partnerId: string,
  summary: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const trimmedSummary = summary.trim();
  if (!trimmedSummary) return { error: "A short summary is required" };
  if (!canPropose(profile.id, partnerId)) return { error: "Not authorized" };

  const { data, error } = await supabase
    .from("collaboration_records")
    .insert({
      proposer_id: profile.id,
      partner_id: partnerId,
      summary: trimmedSummary,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) {
    return {
      error: toUserErrorMessage(
        error,
        "Could not send this collaboration record. Please try again."
      ),
    };
  }
  revalidateCollaborationSurfaces(profile.id, partnerId);
  return { id: data.id };
}

export async function confirmCollaboration(recordId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const { data: record } = await supabase
    .from("collaboration_records")
    .select("id, proposer_id, partner_id, status")
    .eq("id", recordId)
    .single();
  if (!record) return { error: "Collaboration record not found" };
  if (
    !canConfirm(
      { status: record.status, proposerId: record.proposer_id, partnerId: record.partner_id },
      profile.id
    )
  ) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("collaboration_records")
    .update({ status: "confirmed", responded_at: new Date().toISOString() })
    .eq("id", recordId);
  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not confirm this collaboration. Please try again."),
    };
  }
  revalidateCollaborationSurfaces(record.proposer_id, record.partner_id);
  return {};
}

export async function declineCollaboration(recordId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const { data: record } = await supabase
    .from("collaboration_records")
    .select("id, proposer_id, partner_id, status")
    .eq("id", recordId)
    .single();
  if (!record) return { error: "Collaboration record not found" };
  if (
    !canDecline(
      { status: record.status, proposerId: record.proposer_id, partnerId: record.partner_id },
      profile.id
    )
  ) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("collaboration_records")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", recordId);
  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not decline this collaboration. Please try again."),
    };
  }
  revalidateCollaborationSurfaces(record.proposer_id, record.partner_id);
  return {};
}

export async function cancelCollaborationProposal(recordId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const { data: record } = await supabase
    .from("collaboration_records")
    .select("id, proposer_id, partner_id, status")
    .eq("id", recordId)
    .single();
  if (!record) return { error: "Collaboration record not found" };
  if (
    !canCancel(
      { status: record.status, proposerId: record.proposer_id, partnerId: record.partner_id },
      profile.id
    )
  ) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase.from("collaboration_records").delete().eq("id", recordId);
  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not withdraw this proposal. Please try again."),
    };
  }
  revalidateCollaborationSurfaces(record.proposer_id, record.partner_id);
  return {};
}
