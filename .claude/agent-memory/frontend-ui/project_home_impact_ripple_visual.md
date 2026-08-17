---
name: project-home-impact-ripple-visual
description: Your Impact Ripple dashboard row rebuilt with dominant central avatar, elliptical orbit rings, and SVG glow connection lines; no missing assets
metadata:
  type: project
---

VISUAL REBUILD DONE (2026-08-17): `engines/belong/components/home/home-impact-ripple.tsx` + `home-impact-ripple.module.css` rebuilt to match `reference/belong-dashboard-reference.png`'s "YOUR IMPACT RIPPLE" section — pure presentation change, no data/copy altered (verified against [[project-home-live-builders-missions-structure]] pattern of doc'ing structure slices).

**What changed**: central `Avatar` grew from `h-24 w-24` (96px) core to `h-32 w-32` (128px) inside a 168px glow ring (`.core`); stage height 340px → 440px; grid track weights shifted center column from `1.3fr` to `2fr` (`minmax(380px,2fr)`) so the visualization dominates the row. Added three elliptical (non-circular, slightly rotated ±3–6deg) `.orbit` rings — cyan/violet/green tri-tone, reusing the *technique* (not the file) of `home-universe.module.css`'s orbit rings, since that file is the approved hero and must not be touched. Added a real SVG `.connections` layer (`viewBox 0 0 100 100`, `preserveAspectRatio="none"`, per-node `linearGradient` fading transparent→color→transparent, `vector-effect: non-scaling-stroke`) drawing a glowing line from center (50,50) to each ripple node's percent position — same visual language as the hero world stage's `.connections` SVG, reimplemented locally (colors are dynamic per-node from real `ring.color` data, so gradients are generated per index rather than hardcoded).

**Data note — no fabricated avatars**: `ImpactEngineData.ripple` (`engines/impact/types.ts`) only carries `{ label, value, max, color }` per category (Network/Build/Community/Contribution) — there is no per-person photo/avatar data backing "people impacted" nodes. The reference mockup shows a couple of small photo-avatar nodes mixed in with icon nodes, but building those would require fabricating people that don't exist in `ImpactEngineData`. Per [[feedback-no-stock-art-placeholder]], kept all 4 ripple nodes as icon-badge circles (existing `RIPPLE_ICON` map: UsersRound/Rocket/Globe2/Heart) styled richer (larger glow "avatar-style" bubble), not photos. If real per-person impacted-user data is ever added to `ImpactEngineData`, that would be a `backend-supabase` + `engines/impact` change, not a frontend-only one.

**Green accent already existed in real data**: `engines/impact/data.ts` ripple array already assigns `color: "#10b981"` (emerald) to the "Contribution" ring — confirms the "green for impact/growth" tone requested by the reference isn't a new invented palette color, it's already load-bearing real data. Reused emerald consistent with `home-live-builders.tsx`'s existing `--tone-a: rgba(16,185,129,.3)` emerald tone.

**Untouched per explicit instruction**: `home-universe.tsx`/`.module.css` (approved hero, do not modify), `home-screen.tsx`, `dashboard/primitives.tsx`, `home-live-builders.*`, `home-missions-row.*`, `home-spotlight.tsx`, `home-numbers.tsx`.
