---
name: feedback-no-stock-art-placeholder
description: Never substitute missing hero/dashboard artwork with stock imagery, generic giant icons, or hand-drawn CSS/SVG landscapes
metadata:
  type: feedback
---

When an approved visual reference calls for a specific piece of artwork (e.g. a "world" hero image) that doesn't exist yet in the repo, do not invent a substitute — not stock/cinematic imagery, not a generic giant icon, not a CSS-drawn landscape (e.g. an SVG mountain-ridge + city-light-dots silhouette was previously built as a stand-in and had to be removed).

**Why**: This was an explicit human correction on BELONG dashboard work — fabricated/generic art was rejected even when visually "in the spirit" of the reference, because it misrepresents what the real product will look like and can get mistaken for the approved design.

**How to apply**: When the required asset is missing, build the full integration architecture (correct path convention, layering, object-fit/positioning, z-index/stacking) so the real asset "just works" when dropped in, but leave that specific visual layer inert — a neutral background-color only. Flag the missing asset explicitly in the report with the exact expected path and spec (aspect ratio/treatment inferred from the reference). See [[project-home-universe-world-art]] for a concrete example (`public/images/home-world.webp`).
