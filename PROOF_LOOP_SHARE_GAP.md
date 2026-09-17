# Proof Loop SHARE gap — found + partially fixed 2026-09-17

## What this is

Autonomous nightly review of `work/proof-loop-v1`, right after it finished
all 10 items of the V1 vertical slice (BELONG_PROOF_LOOP.md). Looked for one
concrete weakness in the work just shipped rather than starting something
new. Found one: the feature that just got marked "last item, closes the
loop end to end" — the shareable deep link — could not actually do the one
thing it exists for.

## The problem

BELONG_PROOF_LOOP.md's own definition of the loop's last two steps:

> 10. IMPACT — Generate an Impact Receipt...
> 11. SHARE — Export the result to the wider internet as a distribution
>     loop back into BELONG.

item 10 of the V1 slice ("shareable deep link") shipped as
`ShareProofButton` — it copies `/proof/[id]` to the clipboard. That's the
entire implementation; `/proof/[id]` was assumed to already be a working
public page. It wasn't, on two independent layers:

1. **App-layer wall.** `/proof` is in `systems/navigation/config.ts`'s
   `platformRoutes`, so `lib/supabase/middleware.ts` redirected every
   logged-out request under `/proof/*` straight to `/login` before
   Next.js ever rendered the page — including the request from whatever
   bot Slack, iMessage, X, or any other destination uses to unfurl a
   shared link into a preview card. A recipient who wasn't already a
   BELONG member saw a bare login screen with no idea what was shared,
   and no preview card at all upstream of that.
2. **Database-layer wall.** Every `proof_claims`/`proof_standards`/
   `proof_challenges`/`proof_approaches`/`proof_evidence`/`proof_outcomes`/
   `proof_participants` RLS SELECT policy in
   `20260824000001_proof_loop_v1.sql` grants `to authenticated` only.
   Fixing (1) alone would just turn the login redirect into an empty
   404 for the same visitor — the anon role has no read grant at all.
3. **Metadata.** `generateMetadata` on `/proof/[id]/page.tsx` only ever
   set a bare `<title>` — no description, no OpenGraph/Twitter tags, no
   image. Moot until (1)+(2) are fixed (a redirect/404 has no metadata to
   unfurl either way), but would have produced a dead gray link-preview
   box even once the page was reachable.

Net effect: the loop's own "distribution loop back into BELONG" — the
thing that's supposed to bring new people in — was fully non-functional.
Every other item in the V1 slice works for the person already inside the
product; this was the one step whose entire job is to work for someone
who isn't.

## What's fixed in this commit (app layer, no DB/deploy involved)

- `lib/supabase/middleware.ts` — `/proof/[id]` (exact claim-detail path,
  UUID-shaped, matched narrowly) is now excluded from the protected-route
  redirect. `/proof` itself (the discovery feed) and every other route
  are untouched and still require sign-in.
- `app/(platform)/proof/[id]/page.tsx` — uses `getCurrentProfile()`
  (nullable) instead of `requireProfile()` (which threw for anyone
  logged out); only fetches the viewer's own projects when a profile
  exists; passes `currentUserId: profile?.id ?? null` through.
- `engines/proof/components/proof-claim-detail-screen.tsx` — accepts a
  nullable `currentUserId`. An anonymous viewer sees the exact same
  read-only content (claim, standard, evidence, challenges, approaches,
  outcome) a member sees, with every action control (Challenge, Approach,
  Show Up, Submit Evidence, Resolve) replaced by one "Sign in to
  participate" link back to `/login?next=/proof/[id]`. Every mutating
  server action in `lib/actions/proof.ts` already calls `requireProfile()`
  independently, so this is a UI convenience, not the security boundary.
- `generateMetadata` now sets a real `description` (from the claim body,
  or a type/stage-derived fallback via the new `proofShareDescription`
  helper in `lib/core/proof.ts`) plus `openGraph`/`twitter` tags, so a
  link preview actually says what the Proof is once it can be fetched.
- Tests: `lib/core/__tests__/proof.test.ts` covers `proofShareDescription`
  (body present, body truncated, body empty → fallback copy). Lint,
  `tsc --noEmit`, and the full `vitest run` suite are green.

## What's drafted but NOT applied — needs the owner's decision

`supabase/migrations/20260917000001_proof_public_anon_read.sql` — grants
the `anon` role the same read-only visibility every authenticated user
already has for non-community claims (it reuses the existing
`can_view_proof_context(community_id, id)` helper unchanged; a
community-scoped claim stays exactly as invisible to `anon` as it already
is to a logged-in non-member). Strictly read-only: no insert/update/delete
grant for `anon` anywhere, and it doesn't touch the `authenticated`
policies at all.

This file is **not applied to any database** — writing an unapplied
migration into the repo and running it later via `supabase db push` is
this repo's existing convention (see `4a0d5d2`, the pending
`circle_invite_notifications` migration). Applying a migration or running
DDL is outside what this autonomous session is allowed to do.

**The actual decision this needs:** is BELONG comfortable with a
non-community Proof's content (claim, evidence, challenges, approaches,
outcome) being readable by anyone with the link — including search
engines and any other unauthenticated crawler — once this migration runs?
That's precisely what BELONG_PROOF_LOOP.md's Arena/SHARE sections describe
("export the result to the wider internet"), and it's already the
platform-wide visibility rule for every *authenticated* user today (a
non-community claim has never been private between members) — this
migration only extends that existing rule to `anon`. But it's a real
product/privacy decision, not just a bug fix, so it's left for approval
rather than pushed through.

**Once approved:** run
`supabase db push` (or apply the migration via the Supabase MCP tools)
against the real project. Nothing else needs to change — the app-layer
fix in this commit already assumes that migration will land, and degrades
safely without it (an anonymous visitor to `/proof/[id]` today gets a
clean 404 instead of a login wall — no crash, no data leak, just "not
public yet").

## Suggested next slice (not started)

Once the migration is approved and applied, verify a real shared link
unfurls correctly in at least one of Slack/iMessage/X's link debuggers,
and consider adding a static OG image (today's `opengraph-image` is text
metadata only, no generated image) — that's a reasonable follow-up, not
bundled into this fix to keep the slice small.
