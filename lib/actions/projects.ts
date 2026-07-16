"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createNotification } from "@/lib/supabase/notify";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";

export async function createProject(data: {
  name: string;
  description?: string;
  deadline?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (!data.name.trim()) return { error: "Name is required" };

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      deadline: data.deadline || null,
      owner_id: profile.id,
      status: "planning",
      progress: 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: profile.id,
    role: "owner",
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { id: project.id };
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    status?: "planning" | "active" | "completed" | "archived";
    progress?: number;
    deadline?: string | null;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (!project || project.owner_id !== profile.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase.from("projects").update(data).eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath("/", "layout");
  return {};
}

export async function inviteToProject(
  projectId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: project } = await supabase
    .from("projects")
    .select("name, owner_id")
    .eq("id", projectId)
    .single();

  if (!project || project.owner_id !== profile.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role: "member",
  });

  if (error) {
    if (error.code === "23505") return { error: "Already a member" };
    return { error: error.message };
  }

  await createNotification(supabase, {
    userId,
    title: "Project invitation",
    body: `You were added to ${project.name}`,
    type: "project",
    metadata: { project_id: projectId },
  });

  revalidatePath("/projects");
  return {};
}
