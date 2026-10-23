// Why BELONG exists: the human needs it answers, each backed by a public source.
// Only published, sourced figures belong here. Never add BELONG usage numbers.

export type HumanNeed = {
  id: "connection" | "growth" | "contribution";
  stat: string;
  statement: string;
  source: { name: string; year: number; url: string };
  answer: string;
};

export const HUMAN_NEEDS: HumanNeed[] = [
  {
    id: "connection",
    stat: "1 in 6",
    statement: "people worldwide are affected by loneliness.",
    source: {
      name: "World Health Organization",
      year: 2025,
      url: "https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death",
    },
    answer: "Accountability circles and communities, so nobody builds alone.",
  },
  {
    id: "growth",
    stat: "64% → 44%",
    statement: "of U.S. adults aged 18 to 29 rate their lives as thriving, down since 2010.",
    source: {
      name: "Gallup",
      year: 2026,
      url: "https://news.gallup.com/poll/715010/life-ratings-young-adults-down-points-2010.aspx",
    },
    answer: "Purpose, goals and weekly missions that turn intention into progress.",
  },
  {
    id: "contribution",
    stat: "35%",
    statement: "of the UN's 2030 targets are on track or making moderate progress.",
    source: {
      name: "United Nations, SDG Report",
      year: 2025,
      url: "https://unstats.un.org/sdgs/report/2025/The-Sustainable-Development-Goals-Report-2025.pdf",
    },
    answer: "Projects with owners, tasks and an honest record of the impact they create.",
  },
];
