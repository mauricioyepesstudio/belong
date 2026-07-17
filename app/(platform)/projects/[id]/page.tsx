import { ProjectDetailScreen } from "@/engines/project";
import { getProjectDetail } from "@/lib/data/projects";
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
  const [data, profile] = await Promise.all([getProjectDetail(id), requireProfile()]);

  if (!data) notFound();

  return (
    <ProjectDetailScreen
      data={data}
      currentUser={{
        id: profile.id,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
      }}
    />
  );
}
