import { OrganizationScreen, getDiscoverOrganizations, getUserOrganizations } from "@/engines/organization";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organizations",
};

export default async function OrganizationsPage() {
  const [joined, discover] = await Promise.all([
    getUserOrganizations(),
    getDiscoverOrganizations(),
  ]);

  return <OrganizationScreen joined={joined} discover={discover} />;
}
