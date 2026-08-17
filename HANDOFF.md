# BELONG Handoff — 2026-08-17

## PROJECT
- Repository: `C:\Projects\belong`
- Branch: `2026-07-16-gbly`
- Task: BELONG dashboard (`/dashboard`) visual redesign toward `reference/belong-dashboard-reference.png`

## STATUS
**Completed and human-visually-approved:**
- Hero/world widget (`home-universe.tsx`) — world artwork integrated (`public/images/home-world.webp`), central avatar correctly centered (verified via DOM measurement, 0px offset). **Do not modify further unless a regression is found.**

**Completed this session, visually improved but not yet human-approved:**
- Live Builders — photo-dominant card architecture rebuilt; real images now flow for post-type activities only (see FILES). Other activity types correctly show a gradient fallback (their tables have no image columns — schema-confirmed, not a bug).
- Missions — artwork-dominant card architecture rebuilt; wired to expected asset paths, all 5 still missing (see NEXT ACTION assets).
- Impact Ripple — rebuilt: larger central avatar, elliptical orbit rings, connected impact nodes, richer glow, left/right metric cards.
- Builder Spotlight — rebuilt: removed empty purple block, contributor photo now dominant (a flex-ratio bug found by visual-qa was fixed).
- BELONG in Numbers — polished: compact list, tone-coded icon chips, stronger typography.

**Intentionally not committed / not done:**
- Nothing has been committed yet this session prior to the checkpoint commit described below.
- No mock/fabricated data was introduced anywhere — every real-data or real-asset gap was flagged, not faked.

## FILES
Changed (pre-existing modifications from earlier sessions, untouched further this session):
`CLAUDE.md`, `app/globals.css`, `components/layout/mobile-nav.tsx`, `components/layout/sidebar.tsx`, `engines/belong/components/home/home-screen.tsx`, `systems/layout/platform-shell.tsx`, `systems/layout/top-nav.tsx`, `systems/navigation/config.ts`, `systems/navigation/index.ts`

Changed this session:
- `engines/belong/components/home/home-universe.tsx` / `.module.css` (hero — approved)
- `engines/belong/global-feed.ts`, `engines/belong/home/feed-builder.ts` (backend: surfaces real `image_url` from `community_posts`/`project_posts` into `HomeActivity.imageUrl` — no schema change)

New this session (untracked):
- `engines/belong/components/home/home-live-builders.tsx` + `.module.css`
- `engines/belong/components/home/home-missions-row.tsx` + `.module.css`
- `engines/belong/components/home/home-impact-ripple.tsx` + `.module.css`
- `engines/belong/components/home/home-spotlight.tsx` + `.module.css`
- `engines/belong/components/home/home-numbers.tsx` + `.module.css`
- `public/images/home-world.webp` (approved hero art)
- `reference/belong-dashboard-reference.png`, `reference/home-world-concept.png`
- `.claude/` (agent definitions, skills, agent-memory — project config)

## VALIDATION
- Typecheck: `npx tsc --noEmit -p tsconfig.json` — clean, 0 errors.
- Lint: targeted `npx eslint` on all changed/new files above — clean, 0 errors.
- Tests: no automated test suite exists for these components.
- Build: not run (targeted checks only, per project convention — run full build if next session wants extra confidence).
- Browser/visual review: live-rendered at `http://localhost:3000/dashboard`, checked section-by-section against the reference. Hero is human-approved; the other 5 sections were live-reviewed by the assistant this session but await human visual sign-off.

## CURRENT PROBLEM
The hero/world section renders inside a bordered rectangular card (`.worldStage`), which reads as a boxed widget rather than the reference's page-integrated composition, and the "This is your world. / Build it. Together." headline sits as separate copy above it instead of overlaying the world visualization.

## NEXT ACTION
De-box the hero: change `.worldStage`'s container/layout in `home-universe.module.css` so the world composition integrates naturally into the page (reference: no enclosing card), and reposition the headline to overlay/integrate with the world visualization — while preserving the existing world artwork and centered-avatar composition exactly as-is (only the surrounding container changes).

## THEN, AFTER THAT (priority order)
1. Build the persistent bottom nav/footer from the reference: Explore, Connect, large illuminated BUILD button (center), Learn, Messages, profile/avatar — new UI, doesn't exist yet.
2. Bring Live Builders + Missions to full reference quality once real imagery lands:
   - Missing: `public/images/missions/mission-{startup,portfolio,community,growth,default}.webp` (landscape, ~2.5:1–4:3, one thematic illustration per bucket).
   - Project/Community/Event cover images require a Supabase schema decision (no image columns exist today) — flag to human, don't auto-add columns.
3. Continue visual refinement of Impact Ripple, Builder Spotlight, Numbers toward tighter reference fidelity.

## DO NOT TOUCH
- `.env.local`, Supabase credentials, Vercel config/credentials, git remotes
- The approved world artwork integration and centered-avatar fix inside `.worldStage` (protect during the de-boxing work above)
- Live Builders / Missions / Impact Ripple / Spotlight / Numbers data contracts (`HomeActivity`, `WeeklyGoal`, `ImpactEngineData`, `TopContributor` types) — presentation-only changes so far, keep it that way unless a human approves a data-layer change
- Global navigation components beyond adding the new bottom bar described above

## REFERENCE
`reference/belong-dashboard-reference.png` (visual contract). `reference/home-world-concept.png` is a concept/source image for the hero art, not itself a page asset.

## GIT
- Branch: `2026-07-16-gbly`
- State before checkpoint commit: dirty (see FILES above)
- Latest relevant commit before this handoff: `e6d9cc7` "show only configured sign-in methods"
- This handoff is committed together with the checkpoint described in the session's git-release step — see commit hash reported at handoff time.
