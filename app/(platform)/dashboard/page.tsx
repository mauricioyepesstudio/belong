import { DashboardScreen, getDashboardData } from "@/engines/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardScreen {...data} />;
}
