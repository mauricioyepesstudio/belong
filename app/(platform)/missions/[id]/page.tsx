import { MissionDetailScreen } from "@/engines/mission/components/mission-detail-screen";
import { getDailyMissionDetail } from "@/engines/mission/data";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getDailyMissionDetail(id);
  return { title: data?.mission.title ?? "Mission" };
}

export default async function MissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getDailyMissionDetail(id);

  if (!data) notFound();

  return <MissionDetailScreen data={data} />;
}
