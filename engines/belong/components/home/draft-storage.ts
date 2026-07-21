const DRAFT_KEY = "belong:home-post-draft";

export type PostDraft = {
  content: string;
  communityId: string;
  communityName?: string;
  updatedAt: string;
};

export function getPostDraft(): PostDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PostDraft;
    return parsed.content.trim() ? parsed : null;
  } catch {
    return null;
  }
}

export function setPostDraft(draft: PostDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearPostDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
}
