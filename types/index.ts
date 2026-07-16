import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  mission?: string;
};

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
};
