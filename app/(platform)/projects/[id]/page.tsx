import { ProjectDetailScreen } from "@/engines/project";
import { getProjectDetail } from "@/lib/data/projects";
import { getCopilotPanelData } from "@/lib/data/ai-copilot";
import { requireProfile } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getProjectDetail(id);
  return { title: data?.project.name ?? "Project" };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getProjectDetail(id);
  const profile = await requireProfile();

  if (!data) notFound();

  const copilot = await getCopilotPanelData("project", data.project.id);

  return (
    <ProjectDetailScreen
      key={`${data.project.id}:${data.project.updated_at}`}
      data={data}
      copilot={copilot}
      currentUser={{
        id: profile.id,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
      }}
    />
  );
}
