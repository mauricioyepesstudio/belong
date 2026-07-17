import type { SupabaseServerClient } from "@/lib/core/types";
import type {
  AICopilotActionStatus,
  AICopilotActionType,
  AICopilotContextType,
  Json,
} from "@/types/database.types";
import type { CopilotOutputPayload } from "./types";
import { outputPayloadToJson } from "./parse-response";

export type CopilotAuditRecord = {
  id: string;
  userId: string;
  contextType: AICopilotContextType;
  contextId: string;
  actionType: AICopilotActionType;
  status: AICopilotActionStatus;
  prompt: string | null;
  outputPayload: CopilotOutputPayload;
  model: string | null;
  tokensUsed: number | null;
  applied: boolean;
  appliedEntityType: string | null;
  appliedEntityId: string | null;
  createdAt: string;
};

function mapOutputPayload(raw: Json): CopilotOutputPayload {
  const obj = raw as Record<string, unknown>;
  const kind = obj.kind as CopilotOutputPayload["kind"];

  switch (kind) {
    case "summary":
      return { kind, text: String(obj.text ?? "") };
    case "answer":
      return { kind, text: String(obj.text ?? "") };
    case "tasks":
      return { kind, items: (obj.items as CopilotOutputPayload & { kind: "tasks" })["items"] ?? [] };
    case "milestones":
      return {
        kind,
        items: (obj.items as CopilotOutputPayload & { kind: "milestones" })["items"] ?? [],
      };
    case "missions":
      return {
        kind,
        items: (obj.items as CopilotOutputPayload & { kind: "missions" })["items"] ?? [],
      };
    case "announcement":
      return {
        kind,
        draft: (obj.draft as CopilotOutputPayload & { kind: "announcement" })["draft"] ?? {
          title: "",
          body: "",
        },
      };
    case "weekly_summary":
      return {
        kind,
        data: (obj.data as CopilotOutputPayload & { kind: "weekly_summary" })["data"] ?? {
          title: "",
          summary: "",
          highlights: [],
        },
      };
    default:
      return { kind: "summary", text: "Unknown output" };
  }
}

export async function logCopilotAction(
  supabase: SupabaseServerClient,
  params: {
    userId: string;
    contextType: AICopilotContextType;
    contextId: string;
    actionType: AICopilotActionType;
    status?: AICopilotActionStatus;
    prompt?: string | null;
    inputSummary: Record<string, unknown>;
    output: CopilotOutputPayload;
    model: string;
    tokensUsed: number | null;
    errorMessage?: string | null;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from("ai_copilot_actions")
    .insert({
      user_id: params.userId,
      context_type: params.contextType,
      context_id: params.contextId,
      action_type: params.actionType,
      status: params.status ?? "completed",
      prompt: params.prompt ?? null,
      input_summary: params.inputSummary as Json,
      output_payload: outputPayloadToJson(params.output) as Json,
      model: params.model,
      tokens_used: params.tokensUsed,
      error_message: params.errorMessage ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to log AI action");
  }

  return data.id;
}

export async function markCopilotActionApplied(
  supabase: SupabaseServerClient,
  actionId: string,
  userId: string,
  appliedEntityType: string,
  appliedEntityId: string
): Promise<void> {
  const { error } = await supabase
    .from("ai_copilot_actions")
    .update({
      applied: true,
      status: "applied",
      applied_entity_type: appliedEntityType,
      applied_entity_id: appliedEntityId,
    })
    .eq("id", actionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCopilotAuditLog(
  supabase: SupabaseServerClient,
  userId: string,
  contextType: AICopilotContextType,
  contextId: string,
  limit = 8
): Promise<CopilotAuditRecord[]> {
  const { data, error } = await supabase
    .from("ai_copilot_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("context_type", contextType)
    .eq("context_id", contextId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    contextType: row.context_type,
    contextId: row.context_id,
    actionType: row.action_type,
    status: row.status,
    prompt: row.prompt,
    outputPayload: mapOutputPayload(row.output_payload),
    model: row.model,
    tokensUsed: row.tokens_used,
    applied: row.applied,
    appliedEntityType: row.applied_entity_type,
    appliedEntityId: row.applied_entity_id,
    createdAt: row.created_at,
  }));
}

export async function fetchCopilotActionById(
  supabase: SupabaseServerClient,
  actionId: string,
  userId: string
): Promise<CopilotAuditRecord | null> {
  const { data, error } = await supabase
    .from("ai_copilot_actions")
    .select("*")
    .eq("id", actionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    contextType: data.context_type,
    contextId: data.context_id,
    actionType: data.action_type,
    status: data.status,
    prompt: data.prompt,
    outputPayload: mapOutputPayload(data.output_payload),
    model: data.model,
    tokensUsed: data.tokens_used,
    applied: data.applied,
    appliedEntityType: data.applied_entity_type,
    appliedEntityId: data.applied_entity_id,
    createdAt: data.created_at,
  };
}
