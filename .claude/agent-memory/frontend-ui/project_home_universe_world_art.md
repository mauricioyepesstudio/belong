---
name: project-home-universe-world-art
description: Home dashboard hero (HomeUniverse orbit widget) world artwork asset delivered and wired in — layered architecture is complete
metadata:
  type: project
---

RESOLVED (2026-08-17): the approved artwork landed at `public/images/home-world.webp` (1672x941px, 2.6MB, circular floating-island composition — glowing city/forest island, warm amber peak light, dark starfield with purple/blue nebula at edges). Integrated into the already-wired `.worldArt` layer with no node/layout changes needed — computed that the orbit node ring radius (~30-36% from center) sits comfortably inside the visible island's actual radius after `object-fit: cover` crop (~38-43% from center), matching the reference. Tuning done: `.worldArt` fallback background simplified to a solid dark color (`#05060f`, matches the image's corner tone) instead of a radial gradient, since it's now just a brief pre-decode fallback fully covered by the opaque image once loaded; added `priority` to the `next/image` to avoid a load-flash on this above-the-fold hero; reduced `.nebulaAmber`/`.nebulaViolet`/`.horizon` overlay opacities (they now only need to nudge legibility, not repaint the scene, since the real photo carries its own color) and slightly strengthened `.vignette` edge darkening for node/line contrast against the busy image.

The central hero/world widget on the authenticated Home screen (`engines/belong/components/home/home-universe.tsx` + `home-universe.module.css`) was refactored (2026-08-17) into a layered architecture matching `reference/belong-dashboard-reference.png`:

1. world artwork (`.worldArt`, z-index 0) — `next/image` with `fill`, reading from `WORLD_ART_SRC = "/images/home-world.webp"`. Has an `onError` handler (`worldArtMissing` state) so a missing file falls back to an inert neutral background-color instead of a broken-image icon.
2. atmosphere wash (nebulaViolet/nebulaAmber/horizon/vignette, z-index 1)
3. stars/particles (z-index 2)
4. glow/fog — orbit rings + core glow (z-index 3)
5. dynamic orbit connection SVG lines (z-index 4)
6. central avatar + progress ring (z-index 5)
7. orbit nodes (z-index 6)

**Why this mattered**: Human reviewer explicitly rejected generic cinematic/stock art as a stand-in for missing artwork ([[feedback-no-stock-art-placeholder]]). The previous implementation had a hand-drawn SVG mountain ridge + city-light dots standing in for the missing art — that was removed for being exactly this kind of fake placeholder, and the layer was deliberately left inert (neutral background only) until the real asset arrived.

**How to apply**: Any future work on this widget should keep the `WORLD_ART_SRC` path and the `onError`-guarded render as the single integration point for the real asset. If asked to "add the world art," just drop the file at `public/images/home-world.webp` — no code changes needed. Do not resurrect the old terrain/city-lights SVG.

Also: the orbit intentionally has 7 nodes (BELONG Platform, People, Communities, Opportunities, Events, Resources, AI Companion), not 8 — "Projects" was dropped from the orbit to match the approved reference exactly. `data.stats.projects` is still surfaced elsewhere in the same component (the "Right now" pulse panel's active-projects count and the stage caption's live-connections total), so no data was lost, just decluttered from this specific widget.
