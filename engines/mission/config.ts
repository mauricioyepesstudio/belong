import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Globe,
  GraduationCap,
  Heart,
  Plane,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import type { BuildGoal, Mission, UserProfile } from "@/types/database.types";

export type BuildGoalOption = {
  id: BuildGoal;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
};

export const BUILD_GOALS: BuildGoalOption[] = [
  {
    id: "startup",
    label: "Startup",
    description: "Launch and scale something new",
    icon: Rocket,
    gradient: "from-violet-500/20 to-indigo-500/10",
  },
  {
    id: "career",
    label: "Career",
    description: "Grow professionally and find purpose",
    icon: Briefcase,
    gradient: "from-blue-500/20 to-cyan-500/10",
  },
  {
    id: "learn",
    label: "Learn",
    description: "Master skills and expand your mind",
    icon: GraduationCap,
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
  {
    id: "health",
    label: "Health",
    description: "Build a stronger body and mind",
    icon: Heart,
    gradient: "from-rose-500/20 to-pink-500/10",
  },
  {
    id: "relationships",
    label: "Relationships",
    description: "Deepen connections that matter",
    icon: Users,
    gradient: "from-fuchsia-500/20 to-purple-500/10",
  },
  {
    id: "community",
    label: "Community",
    description: "Create belonging and collective impact",
    icon: Globe,
    gradient: "from-amber-500/20 to-orange-500/10",
  },
  {
    id: "travel",
    label: "Travel",
    description: "Explore the world and grow through experience",
    icon: Plane,
    gradient: "from-sky-500/20 to-blue-500/10",
  },
  {
    id: "creator",
    label: "Creator",
    description: "Share your voice and build an audience",
    icon: Sparkles,
    gradient: "from-purple-500/20 to-violet-500/10",
  },
];

export const BUILD_GOAL_PROMPTS: Record<BuildGoal, string> = {
  startup: "Describe the startup you're building...",
  career: "What career path are you pursuing?",
  learn: "What do you want to learn?",
  health: "What health goals are you working toward?",
  relationships: "What kind of relationships do you want to build?",
  community: "What community do you want to create or join?",
  travel: "Where is your journey taking you?",
  creator: "What do you want to create?",
};

export function getBuildGoalOption(goal: BuildGoal | null | undefined) {
  if (!goal) return null;
  return BUILD_GOALS.find((g) => g.id === goal) ?? null;
}

export function getMissionText(
  profile: UserProfile,
  mission: Mission | null
): string | null {
  return (
    mission?.description?.trim() ||
    profile.build_vision?.trim() ||
    null
  );
}
