import { OrganizationDetailScreen } from "@/engines/organization";
import { getOrganizationDetail, getOrganizationInviteCandidates } from "@/lib/data/organizations";
import { getCopilotPanelData } from "@/lib/data/ai-copilot";
import { requireProfile } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getOrganizationDetail(slug);
  return { title: data?.organization.name ?? "Organization" };
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getOrganizationDetail(slug);
  const profile = await requireProfile();

  if (!data) notFound();

  const inviteCandidates = await getOrganizationInviteCandidates(
    data.members.map((m) => m.userId)
  );

  const copilot = await getCopilotPanelData("organization", data.organization.id);

  return (
    <OrganizationDetailScreen
      data={data}
      copilot={copilot}
      inviteCandidates={inviteCandidates}
      currentUser={{
        id: profile.id,
        fullName: profile.full_name,
      }}
    />
  );
}
