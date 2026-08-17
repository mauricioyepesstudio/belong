---
name: project-home-builder-spotlight-structure
description: Builder Spotlight dashboard row rebuilt image/editorial-dominant; real photo data exists only for top contributor and impact activity, not project/community
metadata:
  type: project
---

STRUCTURE SLICE DONE (2026-08-17): `engines/belong/components/home/home-spotlight.tsx` + new `home-spotlight.module.css` rebuilt to match `reference/belong-dashboard-reference.png`'s "BUILDER SPOTLIGHT" row — same slice pattern as [[project-home-live-builders-missions-structure]] (structure/fallback-architecture only, no data-layer changes, no commit).

**Layout**: outer row is `grid lg:grid-cols-[1.3fr_1.9fr_0.9fr]` — featured top-contributor card, a `grid-cols-3` sub-row of three editorial tiles (Project/Community/Impact Spotlight), then `HomeNumbers` (untouched, still gets its own column slot).

**Featured top-contributor card** (`.featureCard`): text block (label/name/points/CTA pill) + full-bleed portrait on the right with a linear-gradient `.featureFade` blending the photo into the card background (mirrors the reference's soft photo-into-bg edge). Photo priority: `topContributor.avatarUrl` → branded gradient fallback with small corner icon (same restrained-fallback convention as Live Builders, never a giant centered icon). Removed the old empty violet/fuchsia gradient + cyan blur that made the card read as "empty purple block" — it's now confined to the fallback-only case and much smaller/corner-anchored.

**Data gap, explicitly not fabricated**: `TopContributor` (`engines/belong/home/types.ts`) only has `{ id, name, avatarUrl, points, href }` — no role/title, bio, or tags fields. The reference shows "Founder de EcoPack" role, a bio sentence, and 3 tag chips (Founder/Sustainability/Impact) that this data shape cannot support. Copy was kept honest to existing fields (name + points + generic "Top contributor" label); did not invent a role/bio/tags UI. Would need `TopContributor` extended with `role: string | null`, `bio: string | null`, `tags: string[]` (backend-supabase scope) to fully match the reference card content.

**Project/Community spotlight tiles**: `ProjectWithMemberCount` (`lib/core/projects.ts`, wraps the `projects` table row) and `DiscoverCommunity` (`engines/core/types.ts`, wraps the `communities` table row) have **no image/cover-art column at all** — checked `types/database.types.ts` `projects` and `communities` Row shapes directly, neither has anything like `cover_image_url` or `avatar_url`. These two tiles therefore always render the branded gradient+grain fallback (`.tileFallback`, tone-keyed: project=violet, community=cyan) — real photos are structurally impossible without a schema change. Would need e.g. `projects.cover_image_url` / `communities.cover_image_url` (or `avatar_url`) columns plus surfacing them through `ProjectWithMemberCount` / `DiscoverCommunity`.

**Impact spotlight tile**: `HomeActivity` already carries `imageUrl` and `author.avatarUrl`, so this tile uses real photo priority (`impactHighlight.imageUrl ?? impactHighlight.author.avatarUrl ?? fallback`) — same pattern as Live Builders. Tone `pink` when no real image.

**Tile CTA copy** ("View project" / "Join community" / "View impact") is new UI copy (the old `SpotlightTile` had no CTA text at all, just a bare link wrapping the card) — added to match the reference's CTA pill under each tile; this is presentation copy, not fabricated data, and hrefs/titles/descriptions are unchanged real data pass-through.

Validated: targeted ESLint on `home-spotlight.tsx` clean; project-wide `tsc --noEmit` clean (0 errors, none in this file).
