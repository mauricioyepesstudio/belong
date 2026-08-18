---
name: project-people-discovery
description: Backend data layer for "Encuentra amigos" / People Discovery feature and its constraints
metadata:
  type: project
---

Built the backend data layer for "Encuentra amigos" (People Discovery) on 2026-08-18, branch `2026-07-16-gbly`. New file `engines/opportunity/discovery.ts` exports `discoverPeople(supabase, viewerProfile, { category, limit, offset })` and a thin wrapper `discoverPeopleForHome(supabase, viewerProfile, limit)` for the home "Sugerencias para ti" carousel — both are the intended single entry point for frontend-ui to consume (no separate scoring logic should be written for either the future `/people/discover` route or the home carousel).

**Why:** CLAUDE.md forbids parallel engines. A complete deterministic matcher already existed at `engines/opportunity/matchers.ts` (`scorePersonMatch`) backed by `SCORE_WEIGHTS` in `engines/opportunity/scoring.ts`. That scoring module is shared with an already-shipped AI companion panel elsewhere on the dashboard (via `getOpportunityRecommendations`/`scoreAllMatches`), so `SCORE_WEIGHTS` must never be rebalanced for this feature — doing so would silently change scores shown elsewhere too.

**How to apply:** Any future work on People Discovery (the `/people/discover` route, the home carousel, or further backend paging/filtering) should extend `engines/opportunity/discovery.ts`, not create new scoring/fetch logic. Key facts to reuse rather than re-derive:
- `fetchPeopleCandidates` (`engines/opportunity/data.ts`) was extended (not replaced) to accept `{ limit, offset }` and is now exported; default call (no options) is byte-identical to prior behavior (limit 40, offset 0), so existing callers (`fetchOpportunityCandidates`) are unaffected. A `.order("id", { ascending: true })` was added to make `.range()` pagination stable — minor, low-risk behavior change (previously unordered).
- Category filter chips (Todos/Diseño/Tecnología/Impacto/Negocios/Comunidad/Educación) have **no backing schema taxonomy** — implemented as a best-effort keyword heuristic (`CATEGORY_KEYWORDS` in discovery.ts) matched against skills/interests/role/bio/community tag text. Treat as approximate, not authoritative.
- **No blocking/hide-user mechanism exists anywhere in the schema** (confirmed via grep across migrations/types at the time this was built). Only self-exclusion and accepted/pending-connection exclusion are applied (inherited from `fetchPeopleCandidates`). If a blocking feature is ever requested, it needs new schema — flag that as a real migration decision, don't fake it.
- Real candidate-count/data-availability in the live DB was NOT verified in this session (no live DB query was run) — whoever wires up the frontend route should confirm actual user counts against the real Supabase project before assuming pagination/infinite-scroll will have enough data to look good.
