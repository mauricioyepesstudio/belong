import { ProjectScreen } from "@/engines/project";
import { getUserProjects, getDiscoverProjects } from "@/lib/data/projects";
import { getUserCommunities } from "@/lib/data/communities";
import { getCurrentProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [projects, discover, communities] = await Promise.all([
    getUserProjects(),
    getDiscoverProjects(),
    getUserCommunities(),
  ]);

  return (
    <ProjectScreen
      projects={projects}
      discover={discover}
      communities={communities}
      currentUserId={profile.id}
    />
  );
}
