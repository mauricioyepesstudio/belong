---
name: project_home_suggestions_carousel
description: "Sugerencias para ti" people carousel added to home screen, plus carousel card-density math for future horizontal carousels
metadata:
  type: project
---

Added `HomeSuggestionsCarousel` (`engines/belong/components/home/home-suggestions-carousel.tsx`),
rendered in `home-screen.tsx` between `HomeUniverse` and `HomeLiveBuilders`. It calls
`discoverPeopleForHome(supabase, profile, 8)` from `engines/opportunity` (added as a new
`suggestedPeople` field on `HomeEngineData` in `engines/belong/data.ts`) — same scoring/filtering
pipeline as `/people/discover`, never reimplemented. Connect action reuses
`sendConnectionRequest` from `lib/actions/connections.ts`, same optimistic-override +
`useToast` pattern as `engines/community/components/community-screen.tsx`.

**Why:** Human wanted a "below the greeting card" placement but the hero (`home-universe.tsx`) was
owned by a parallel slice — inserting immediately after `<HomeUniverse />` in render order was the
correct non-invasive interpretation (purely additive: one import line + one JSX line in
`home-screen.tsx`, no reordering).

**Carousel card-density math** (useful for any future horizontal carousel on this dashboard,
which uses `px-3` page padding on mobile per `systems/layout/platform-shell.tsx`, i.e. content
width ≈ viewport − 24px):
- [[project_home_live_builders_missions_structure]] tuned `min-w-[84%] sm:min-w-[300px]` for a
  "one card + peek" density (~1 card visible).
- This carousel needed a denser "~2.3-2.6 cards visible" target, solved with
  `min-w-[38%] sm:min-w-[220px]` + `gap-3` (12px): at 360px viewport (336px content) that's
  336/(0.38×336+12) ≈ 2.41 cards visible; at 430px viewport (406px content) that's
  406/(0.38×406+12) ≈ 2.44 cards visible — consistent across the 360-430px band because the
  percentage-based width scales with the container.
- General formula: visible_cards ≈ container_width / (pct × container_width + gap_px).

Empty state: component returns `null` entirely when `people.length === 0` (no fake/padded
profiles), per [[feedback_no_stock_art_placeholder]]'s broader "never fabricate" rule extended to
data, not just art.

**Connect button language scoping (2026-08-18 fix):** Section header/subtitle/"view all" copy in
`home-suggestions-carousel.tsx` was translated to English (matches sibling home sections — Live
Builders/Missions/Impact Ripple/Spotlight are all English). The Connect/Pending/Connected button
labels were ALSO translated to English in both this file's `ConnectAction` and
`engines/opportunity/components/discovery-person-card.tsx` (used inside `/people/discover`, which
otherwise intentionally stays Spanish per human decision — see
[[project_people_discover_route]]). This was a deliberate scoped exception: the connect-action
button is treated as a shared, state-driven UI primitive that should read identically wherever it
appears, even though the page around it (`people-discovery-screen.tsx`,
`discovery-category-chips.tsx`) stays Spanish. Variant mapping standardized across both files:
`none` → `variant="brand"` (primary/enabled), `pending-sent`/`pending-received` → `variant="secondary"`
(disabled, label "Pending"), `connected` → `variant="ghost"` (disabled, label "Connected") — pending
and connected are deliberately distinct variants from each other, but identical between the two
files. If asked to touch either component's language again, don't assume the whole file's language
follows the screen it's embedded in — check whether the change is to the shared Connect button
specifically vs. page-level copy.
