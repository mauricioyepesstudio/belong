"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import { toUserErrorMessage } from "@/lib/errors/user-message";
import {
  CIRCLE_MAX_MEMBERS,
  canAccept,
  canDeleteCheckin,
  canInvite,
  canPostCheckin,
  isAtCapacity,
} from "@/engines/circles";

function revalidateCircleSurfaces() {
  revalidatePath("/dashboard");
}

export async function createCircle({
  name,
  goalDescription,
  inviteUserIds,
}: {
  name: string;
  goalDescription: string;
  inviteUserIds: string[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmedName = name.trim();
  const trimmedGoal = goalDescription.trim();
  if (!trimmedName) return { error: "A circle name is required" };
  if (!trimmedGoal) return { error: "A goal description is required" };

  const invitees = [...new Set(inviteUserIds)].filter((id) => id && id !== profile.id);
  if (1 + invitees.length > CIRCLE_MAX_MEMBERS) {
    return { error: `Circles can have at most ${CIRCLE_MAX_MEMBERS} members` };
  }

  const { data: circle, error: circleError } = await supabase
    .from("accountability_circles")
    .insert({
      name: trimmedName,
      goal_description: trimmedGoal,
      creator_id: profile.id,
    })
    .select("id")
    .single();
  if (circleError || !circle) {
    return {
      error: toUserErrorMessage(circleError, "Could not create this circle. Please try again."),
    };
  }

  // Bootstrap the creator's own membership: RLS only allows inserting rows
  // with status='invited', so accept it in a second step (auth.uid() =
  // user_id lets a member always accept their own invite).
  const { error: creatorInsertError } = await supabase.from("accountability_circle_members").insert({
    circle_id: circle.id,
    user_id: profile.id,
    role: "owner",
    status: "invited",
  });
  const { error: creatorAcceptError } = creatorInsertError
    ? { error: creatorInsertError }
    : await supabase
        .from("accountability_circle_members")
        .update({ status: "active", joined_at: new Date().toISOString() })
        .eq("circle_id", circle.id)
        .eq("user_id", profile.id);

  if (creatorInsertError || creatorAcceptError) {
    await supabase.from("accountability_circles").delete().eq("id", circle.id);
    return {
      error: toUserErrorMessage(
        creatorInsertError ?? creatorAcceptError,
        "Could not create this circle. Please try again."
      ),
    };
  }

  for (const inviteeId of invitees) {
    const { error: inviteError } = await supabase.from("accountability_circle_members").insert({
      circle_id: circle.id,
      user_id: inviteeId,
      role: "member",
      status: "invited",
    });
    if (inviteError) {
      await supabase.from("accountability_circles").delete().eq("id", circle.id);
      return {
        error: toUserErrorMessage(inviteError, "Could not invite everyone to this circle."),
      };
    }
  }

  revalidateCircleSurfaces();
  return { id: circle.id };
}

export async function respondToCircleInvite(
  circleId: string,
  accept: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: membership } = await supabase
    .from("accountability_circle_members")
    .select("id, user_id, status")
    .eq("circle_id", circleId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!membership) return { error: "Invite not found" };

  if (accept) {
    if (!canAccept({ userId: membership.user_id, status: membership.status }, profile.id)) {
      return { error: "Not authorized" };
    }
    const { error } = await supabase
      .from("accountability_circle_members")
      .update({ status: "active", joined_at: new Date().toISOString() })
      .eq("id", membership.id);
    if (error) {
      return {
        error: toUserErrorMessage(error, "Could not accept this invite. Please try again."),
      };
    }
    revalidateCircleSurfaces();
    return {};
  }

  if (membership.status !== "invited") {
    return { error: "This invite has already been resolved" };
  }
  const { error } = await supabase
    .from("accountability_circle_members")
    .delete()
    .eq("id", membership.id);
  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not decline this invite. Please try again."),
    };
  }
  revalidateCircleSurfaces();
  return {};
}

export async function inviteToCircle(circleId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: circle } = await supabase
    .from("accountability_circles")
    .select("id, creator_id")
    .eq("id", circleId)
    .maybeSingle();
  if (!circle) return { error: "Circle not found" };

  const { data: actingMembership } = await supabase
    .from("accountability_circle_members")
    .select("user_id, status")
    .eq("circle_id", circleId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (
    !canInvite(
      { creatorId: circle.creator_id },
      { userId: profile.id, status: actingMembership?.status ?? null }
    )
  ) {
    return { error: "Not authorized" };
  }

  const { data: existingTarget } = await supabase
    .from("accountability_circle_members")
    .select("id")
    .eq("circle_id", circleId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingTarget) return { error: "This person is already invited or a member" };

  const { count } = await supabase
    .from("accountability_circle_members")
    .select("id", { count: "exact", head: true })
    .eq("circle_id", circleId)
    .in("status", ["invited", "active"]);
  if (isAtCapacity(count ?? 0)) {
    return { error: `Circles can have at most ${CIRCLE_MAX_MEMBERS} members` };
  }

  const { error } = await supabase.from("accountability_circle_members").insert({
    circle_id: circleId,
    user_id: userId,
    role: "member",
    status: "invited",
  });
  if (error) {
    return { error: toUserErrorMessage(error, "Could not send this invite. Please try again.") };
  }
  revalidateCircleSurfaces();
  return {};
}

export async function leaveCircle(circleId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: membership } = await supabase
    .from("accountability_circle_members")
    .select("id")
    .eq("circle_id", circleId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!membership) return { error: "You are not a member of this circle" };

  const { error } = await supabase
    .from("accountability_circle_members")
    .delete()
    .eq("id", membership.id);
  if (error) {
    return { error: toUserErrorMessage(error, "Could not leave this circle. Please try again.") };
  }
  revalidateCircleSurfaces();
  return {};
}

export async function removeCircleMember(
  circleId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: circle } = await supabase
    .from("accountability_circles")
    .select("id, creator_id")
    .eq("id", circleId)
    .maybeSingle();
  if (!circle) return { error: "Circle not found" };
  if (circle.creator_id !== profile.id) return { error: "Not authorized" };

  const { error } = await supabase
    .from("accountability_circle_members")
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", userId);
  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not remove this member. Please try again."),
    };
  }
  revalidateCircleSurfaces();
  return {};
}

export async function postCircleCheckin(circleId: string, body: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmedBody = body.trim();
  if (!trimmedBody) return { error: "Check-in cannot be empty" };

  // Never trust RLS alone: re-verify the caller is an active member before
  // inserting, mirroring every other action in this file.
  const { data: actingMembership } = await supabase
    .from("accountability_circle_members")
    .select("user_id, status")
    .eq("circle_id", circleId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (
    !canPostCheckin(
      actingMembership ? { userId: actingMembership.user_id, status: actingMembership.status } : null,
      profile.id
    )
  ) {
    return { error: "Only active members can post a check-in" };
  }

  const { data: checkin, error } = await supabase
    .from("accountability_checkins")
    .insert({
      circle_id: circleId,
      author_id: profile.id,
      body: trimmedBody,
    })
    .select("id")
    .single();
  if (error || !checkin) {
    return {
      error: toUserErrorMessage(error, "Could not post this check-in. Please try again."),
    };
  }

  revalidatePath(`/circles/${circleId}`);
  return { id: checkin.id };
}

export async function deleteCircleCheckin(checkinId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: checkin } = await supabase
    .from("accountability_checkins")
    .select("id, circle_id, author_id")
    .eq("id", checkinId)
    .maybeSingle();
  if (!checkin) return { error: "Check-in not found" };

  if (!canDeleteCheckin({ authorId: checkin.author_id }, profile.id)) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase.from("accountability_checkins").delete().eq("id", checkin.id);
  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not delete this check-in. Please try again."),
    };
  }

  revalidatePath(`/circles/${checkin.circle_id}`);
  return {};
}
