---

name: belong-visual

description: Execute BELONG visual implementation work against the approved dashboard reference using the existing frontend architecture and real data.

---



\# BELONG Visual Skill



Use this skill for any BELONG dashboard/UI fidelity work.



Source of truth:



\- Existing BELONG architecture

\- Existing real Supabase data

\- Existing Mission Engine

\- Existing Impact Engine

\- Existing Opportunity Graph

\- Approved BELONG visual reference



Rules:



1\. Never modify .env.local, credentials, Supabase config, Vercel config or Git config.

2\. Never create a second dashboard.

3\. Never replace real data with fake production values.

4\. Preserve routes, permissions and backend behavior.

5\. Work in small visual slices.

6\. Prefer existing design-system primitives.

7\. Do not use giant generic icons as substitutes for required artwork.

8\. Respect prefers-reduced-motion.

9\. Keep responsive behavior.

10\. Do not commit without visual approval.



Workflow:



1\. Inspect the target component.

2\. Inspect existing data already available to it.

3\. Implement the smallest visible improvement.

4\. Run targeted lint/typecheck.

5\. Open localhost dashboard.

6\. Compare against the approved reference.

7\. Report remaining visual differences.

8\. Stop before commit.



Visual priorities:



\- cinematic personal universe

\- strong central user focal point

\- People / Communities / Projects / Opportunities / Events / Resources / AI Companion

\- left intelligence column

\- right intelligence column

\- Live Builders

\- Missions

\- Impact Ripple

\- Builder Spotlight

\- BELONG in Numbers

\- central BUILD dock

\- premium dark navy / cyan / violet / selective amber/green visual language



Never call a result visually complete merely because build/tests pass.



