import { CommunityDetailScreen } from "@/engines/community/components/community-detail-screen";
import { getCommunityDetail } from "@/lib/data/communities";
import { getCopilotPanelData } from "@/lib/data/ai-copilot";
import { getAcceptedConnections } from "@/lib/data/connections";
import { requireProfile } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ post?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCommunityDetail(slug);
  return { title: data?.community.name ?? "Community" };
}

export default async function CommunityDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { post: highlightPostId } = await searchParams;
  const data = await getCommunityDetail(slug);
  const profile = await requireProfile();

  if (!data) notFound();

  const copilot = await getCopilotPanelData("community", data.community.id);
  const inviteCandidates = await getAcceptedConnections();

  return (
    <CommunityDetailScreen
      data={data}
      copilot={copilot}
      inviteCandidates={inviteCandidates}
      highlightPostId={highlightPostId ?? null}
      currentUser={{
        id: profile.id,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
      }}
    />
  );
}
