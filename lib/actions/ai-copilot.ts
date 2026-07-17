"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";
import type {
  AICopilotActionType,
  AICopilotContextType,
} from "@/types/database.types";
import { verifyCopilotAccess } from "@/lib/core/ai-copilot";
import { buildCopilotContext } from "@/engines/ai/copilot/context-builder";
import { copilotService } from "@/engines/ai/copilot/service";
import {
  fetchCopilotActionById,
  fetchCopilotAuditLog,
  logCopilotAction,
  markCopilotActionApplied,
} from "@/engines/ai/copilot/audit";
import type { CopilotOutputPayload } from "@/engines/ai/copilot/types";
import { createCommunityPost } from "@/lib/actions/communities";
import { createProjectPost } from "@/lib/actions/projects";
import { createProjectMilestone, createProjectTask } from "@/lib/actions/project-workspace";
import { saveLifeMission } from "@/lib/actions/life-mission";
import { createNotification } from "@/lib/supabase/notify";
import { recordImpactEvent } from "@/engines/identity/reputation";

function revalidateCopilotContext(
  contextType: AICopilotContextType,
  contextId: string,
  slug?: string
) {
  revalidatePath("/dashboard");
  if (contextType === "community" && slug) {
    revalidatePath("/community");
    revalidatePath(`/community/${slug}`);
  }
  if (contextType === "project") {
    revalidatePath("/projects");
    revalidatePath(`/projects/${contextId}`);
  }
  if (contextType === "organization" && slug) {
    revalidatePath("/organizations");
    revalidatePath(`/organizations/${slug}`);
  }
}

export async function runCopilotAction(input: {
  contextType: AICopilotContextType;
  contextId: string;
  slug?: string;
  actionType: AICopilotActionType;
  prompt?: string;
}): Promise<
  ActionResult & {
    actionId?: string;
    output?: CopilotOutputPayload;
  }
> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const access = await verifyCopilotAccess(supabase, {
    contextType: input.contextType,
    contextId: input.contextId,
    userId: profile.id,
  });

  if (!access.canUse) return { error: access.error ?? "Not authorized" };

  if (input.actionType === "answer_question" && !input.prompt?.trim()) {
    return { error: "Question is required" };
  }

  const context = await buildCopilotContext(supabase, {
    contextType: input.contextType,
    contextId: input.contextId,
    userId: profile.id,
    slug: input.slug,
  });

  if (!context) return { error: "Context not found" };

  try {
    const result = await copilotService.run({
      context,
      actionType: input.actionType,
      prompt: input.prompt,
    });

    const actionId = await logCopilotAction(supabase, {
      userId: profile.id,
      contextType: input.contextType,
      contextId: input.contextId,
      actionType: input.actionType,
      prompt: input.prompt ?? null,
      inputSummary: result.inputSummary,
      output: result.output,
      model: result.model,
      tokensUsed: result.tokensUsed,
    });

    revalidateCopilotContext(input.contextType, input.contextId, input.slug);

    return { actionId, output: result.output };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI action failed";

    await logCopilotAction(supabase, {
      userId: profile.id,
      contextType: input.contextType,
      contextId: input.contextId,
      actionType: input.actionType,
      prompt: input.prompt ?? null,
      inputSummary: { contextId: input.contextId, actionType: input.actionType },
      output: { kind: "summary", text: message },
      model: "error",
      tokensUsed: null,
      status: "failed",
      errorMessage: message,
    }).catch(() => undefined);

    return { error: message };
  }
}

async function notifyOrganizationMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  title: string,
  body: string,
  actorId: string
) {
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .neq("user_id", actorId);

  await Promise.all(
    (members ?? []).map((member) =>
      createNotification(supabase, {
        userId: member.user_id,
        title,
        body,
        type: "system",
        metadata: { organization_id: organizationId, source: "ai_copilot" },
      })
    )
  );
}

export async function applyCopilotAction(input: {
  actionId: string;
  itemIndex?: number;
}): Promise<ActionResult & { entityId?: string }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const record = await fetchCopilotActionById(supabase, input.actionId, profile.id);
  if (!record) return { error: "AI action not found" };
  if (record.applied) return { error: "Already applied" };

  const access = await verifyCopilotAccess(supabase, {
    contextType: record.contextType,
    contextId: record.contextId,
    userId: profile.id,
  });

  if (!access.canApply) {
    return { error: "You do not have permission to apply AI actions in this context" };
  }

  const context = await buildCopilotContext(supabase, {
    contextType: record.contextType,
    contextId: record.contextId,
    userId: profile.id,
  });

  if (!context) return { error: "Context not found" };

  const output = record.outputPayload;
  const index = input.itemIndex ?? 0;

  try {
    let entityType = "ai_output";
    let entityId = record.id;

    switch (output.kind) {
      case "tasks": {
        const task = output.items[index];
        if (!task) return { error: "Task not found in AI output" };

        if (record.contextType === "project") {
          const result = await createProjectTask(record.contextId, {
            title: task.title,
            description: task.description,
            priority: task.priority,
          });
          if (result.error) return result;
          entityType = "project_task";
          entityId = result.taskId ?? record.id;
        } else {
          const lines = output.items.map((t, i) => `${i + 1}. ${t.title}`).join("\n");
          const content = `**AI-generated action items**\n\n${lines}`;
          if (record.contextType === "community") {
            const post = await createCommunityPost(record.contextId, content);
            if (post.error) return post;
            entityType = "community_post";
            entityId = post.post?.id ?? record.id;
          } else {
            const { data: org } = await supabase
              .from("organizations")
              .select("slug")
              .eq("id", record.contextId)
              .single();
            await notifyOrganizationMembers(
              supabase,
              record.contextId,
              "AI action items",
              lines,
              profile.id
            );
            entityType = "organization_notification";
            entityId = record.id;
            revalidateCopilotContext("organization", record.contextId, org?.slug);
          }
        }
        break;
      }
      case "milestones": {
        if (record.contextType !== "project") {
          return { error: "Milestones can only be applied in project context" };
        }
        const milestone = output.items[index];
        if (!milestone) return { error: "Milestone not found in AI output" };
        const result = await createProjectMilestone(record.contextId, milestone);
        if (result.error) return result;
        entityType = "project_milestone";
        entityId = record.id;
        break;
      }
      case "missions": {
        const mission = output.items[index] ?? output.items[0];
        if (!mission) return { error: "Mission suggestion not found" };
        const result = await saveLifeMission({
          title: mission.title,
          description: mission.description,
        });
        if (result.error) return result;
        entityType = "life_mission";
        entityId = result.mission?.id ?? record.id;
        break;
      }
      case "announcement": {
        const prefix = `**${output.draft.title}**\n\n`;
        const content = `${prefix}${output.draft.body}`;
        if (record.contextType === "community") {
          const post = await createCommunityPost(record.contextId, content);
          if (post.error) return post;
          entityType = "community_post";
          entityId = post.post?.id ?? record.id;
        } else if (record.contextType === "project") {
          const post = await createProjectPost(record.contextId, content);
          if (post.error) return post;
          entityType = "project_post";
          entityId = post.post?.id ?? record.id;
        } else {
          const { data: org } = await supabase
            .from("organizations")
            .select("slug")
            .eq("id", record.contextId)
            .single();
          await notifyOrganizationMembers(
            supabase,
            record.contextId,
            output.draft.title,
            output.draft.body,
            profile.id
          );
          entityType = "organization_announcement";
          entityId = record.id;
          revalidateCopilotContext("organization", record.contextId, org?.slug);
        }
        break;
      }
      case "weekly_summary": {
        const content = `**${output.data.title}**\n\n${output.data.summary}\n\n${output.data.highlights.map((h) => `• ${h}`).join("\n")}`;
        if (record.contextType === "community") {
          const post = await createCommunityPost(record.contextId, content);
          if (post.error) return post;
          entityType = "community_post";
          entityId = post.post?.id ?? record.id;
        } else if (record.contextType === "project") {
          const post = await createProjectPost(record.contextId, content);
          if (post.error) return post;
          entityType = "project_post";
          entityId = post.post?.id ?? record.id;
        } else {
          const { data: org } = await supabase
            .from("organizations")
            .select("slug")
            .eq("id", record.contextId)
            .single();
          await notifyOrganizationMembers(
            supabase,
            record.contextId,
            output.data.title,
            output.data.summary,
            profile.id
          );
          entityType = "organization_weekly_summary";
          entityId = record.id;
          revalidateCopilotContext("organization", record.contextId, org?.slug);
        }
        break;
      }
      default:
        return { error: "This AI output cannot be applied automatically" };
    }

    await markCopilotActionApplied(supabase, record.id, profile.id, entityType, entityId);

    await recordImpactEvent(supabase, {
      userId: profile.id,
      module: "system",
      eventType: "ai_copilot_applied",
      points: 6,
      sourceId: record.contextId,
      metadata: {
        action_id: record.id,
        action_type: record.actionType,
        context_type: record.contextType,
        entity_type: entityType,
        entity_id: entityId,
      },
    });

    revalidateCopilotContext(record.contextType, record.contextId, context.slug);

    return { entityId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to apply AI action" };
  }
}

export async function refreshCopilotAuditLog(
  contextType: AICopilotContextType,
  contextId: string
) {
  const supabase = await createClient();
  const profile = await requireProfile();
  return fetchCopilotAuditLog(supabase, profile.id, contextType, contextId);
}
