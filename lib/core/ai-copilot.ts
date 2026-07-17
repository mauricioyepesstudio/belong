import type { SupabaseServerClient } from "./types";
import type { AICopilotContextType } from "@/types/database.types";
import { fetchOrganizationMembership, canWriteOrganization } from "./organizations";

export type CopilotAccess = {
  canUse: boolean;
  canApply: boolean;
  error?: string;
};

export async function verifyCopilotAccess(
  supabase: SupabaseServerClient,
  params: {
    contextType: AICopilotContextType;
    contextId: string;
    userId: string;
  }
): Promise<CopilotAccess> {
  if (params.contextType === "community") {
    const { data } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", params.contextId)
      .eq("user_id", params.userId)
      .maybeSingle();

    if (!data) return { canUse: false, canApply: false, error: "You must be a community member" };
    return { canUse: true, canApply: true };
  }

  if (params.contextType === "project") {
    const { data } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", params.contextId)
      .eq("user_id", params.userId)
      .maybeSingle();

    if (!data) return { canUse: false, canApply: false, error: "You must be a project member" };
    return { canUse: true, canApply: true };
  }

  if (params.contextType === "organization") {
    const membership = await fetchOrganizationMembership(
      supabase,
      params.contextId,
      params.userId
    );
    if (!membership) {
      return { canUse: false, canApply: false, error: "You must be an organization member" };
    }
    const canApply = canWriteOrganization(membership.role);
    return { canUse: true, canApply };
  }

  return { canUse: false, canApply: false, error: "Invalid context" };
}
