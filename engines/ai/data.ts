import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { verifyCopilotAccess } from "@/lib/core/ai-copilot";
import { fetchCopilotAuditLog } from "@/engines/ai/copilot/audit";
import type { AICopilotContextType } from "@/types/database.types";

export type CopilotPanelData = {
  canUse: boolean;
  canApply: boolean;
  recentActions: Awaited<ReturnType<typeof fetchCopilotAuditLog>>;
};

export async function getCopilotPanelData(
  contextType: AICopilotContextType,
  contextId: string
): Promise<CopilotPanelData> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const access = await verifyCopilotAccess(supabase, {
    contextType,
    contextId,
    userId: profile.id,
  });

  if (!access.canUse) {
    return { canUse: false, canApply: false, recentActions: [] };
  }

  let recentActions: CopilotPanelData["recentActions"] = [];
  try {
    recentActions = await fetchCopilotAuditLog(
      supabase,
      profile.id,
      contextType,
      contextId
    );
  } catch (error) {
    console.error("Copilot audit log unavailable:", error);
  }

  return {
    canUse: access.canUse,
    canApply: access.canApply,
    recentActions,
  };
}
