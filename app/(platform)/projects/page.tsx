import { ProjectsView } from "@/components/features/projects/projects-view";
import { getUserProjects } from "@/lib/data/projects";
import { getCurrentProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const projects = await getUserProjects();
  return <ProjectsView projects={projects} currentUserId={profile.id} />;
}
