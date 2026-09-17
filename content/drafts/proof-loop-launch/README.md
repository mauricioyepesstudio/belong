# Proof Loop Launch — Content Drafts

Status: DRAFT ONLY. Nothing in this folder has been posted, published, scheduled, or sent anywhere. No external tool was called to publish this content.

## What shipped (verified this session via git log + code review)

The complete V1 vertical slice of BELONG's Proof Loop, per `BELONG_PROOF_LOOP.md`:

1. Proof creation entry point — `engines/belong/components/dashboard/create-proof-modal.tsx`
2. Structured claim/goal + success criteria — `lib/core/proof.ts`, `supabase/migrations/20260824000001_proof_loop_v1.sql`
3. PROVE IT / SHOW ME interaction — `engines/proof/components/proof-screen.tsx`
4. Challenge + Approach creation — `engines/proof/components/create-challenge-modal.tsx`, `engines/proof/components/create-approach-modal.tsx`
5. SHOW UP linking into a real Project — `engines/proof/components/show-up-modal.tsx`
6. Evidence timeline — `engines/proof/components/submit-evidence-modal.tsx`
7. Outcome resolution — `engines/proof/components/resolve-proof-modal.tsx`
8. Impact Receipt generation — `supabase/migrations/20260915000001_proof_impact_receipt.sql`
9. Proof shown on Profile / Story Deck — `components/features/social/social-profile-view.tsx` (Proofs section, links to `/proof/[id]`)
10. Shareable deep link — `app/(platform)/proof/[id]/page.tsx`, `engines/proof/components/share-proof-button.tsx`

Nav entry point: "Proof" at `/proof` (`systems/navigation/config.ts`).

## What this campaign is NOT claiming

- No user counts, download numbers, or engagement metrics (none exist yet / none are used).
- No testimonials or user quotes (none exist).
- No product-UI screenshots included in these drafts — those must come from an actual approved UI capture, added by a human, not fabricated by this agent.
- The three demo scenarios (creator mobilization, entrepreneurship jobs challenge, political bridge) are the product's own V1 demo framing from `BELONG_PROOF_LOOP.md`, used here as explanatory story hooks for what the feature enables — they are NOT reported as real completed outcomes, real user counts, or real dollar/job/meal totals. Copy is written to make clear these are example Proofs you can open in the product, not case studies of things that already happened.

## Visual assets

`assets/` holds real brand photography the founder provided directly (not AI-fabricated, not product screenshots). Wired into the three slots that were always brand/cover art rather than app UI:

- `assets/hero-find-your-people.png` — X launch thread, tweet 1
- `assets/hero-we-all-belong.png` — LinkedIn launch post
- `assets/cover-people-purpose-proof.png` — Instagram carousel Slide 1 (cover); same image used on the live marketing site hero

Slides/posts that explicitly need real `/proof` UI captures (Instagram Slides 3-5, all of `06-instagram-followups.md`, Slide 2 of the carousel) are untouched — substituting brand art there would misrepresent it as a product screenshot.

## Files in this set

- `00-calendar.md` — proposed posting calendar (dates/slots) across all three platforms
- `01-twitter-thread-launch.md` — X/Twitter: launch thread (day 1)
- `02-twitter-followups.md` — X/Twitter: 3 single-scenario follow-up posts
- `03-linkedin-launch.md` — LinkedIn: launch post (day 1)
- `04-linkedin-followup.md` — LinkedIn: mechanism/philosophy follow-up post
- `05-instagram-launch.md` — Instagram: launch carousel caption + slide outline
- `06-instagram-followups.md` — Instagram: 3 scenario-story posts (feed + Stories outline)

## Before anything goes out (human approval required)

- [ ] Confirm which account/handle posts each platform (BELONG's official X, LinkedIn company page, Instagram handle) — not specified anywhere in this repo, must be supplied by a human.
- [ ] Approve final copy per post (edits welcome).
- [ ] Approve the three brand-art placements already made (see Visual assets above), and supply real `/proof` UI screenshots/recordings for the remaining slots — none are fabricated or assumed here.
- [ ] Confirm scheduling tool/process (Buffer, native scheduler, manual) and who executes it.
- [ ] Legal/compliance pass on the political-bridge scenario post specifically, given BELONG's epistemic-neutrality rules in `BELONG_PROOF_LOOP.md` (never implies BELONG adjudicated ideology or that a participant changed political identity).
- [ ] No tool in this agent's scope posts, publishes, schedules, or sends anything externally. That action requires a human or a separate explicitly-authorized step.
