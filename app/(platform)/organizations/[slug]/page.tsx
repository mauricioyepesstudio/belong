import { OrganizationDetailScreen } from "@/engines/organization";
import { getOrganizationDetail } from "@/lib/data/organizations";
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
  const [data, profile] = await Promise.all([getOrganizationDetail(slug), requireProfile()]);

  if (!data) notFound();

  return (
    <OrganizationDetailScreen
      data={data}
      currentUser={{
        id: profile.id,
        fullName: profile.full_name,
      }}
    />
  );
}
