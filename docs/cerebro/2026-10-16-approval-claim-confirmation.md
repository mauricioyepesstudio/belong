# BELONG — 2026-10-16

## PROJECT
- Isolated checkout: belong-run-20261016; branch codex/belong-task-confirmation-20261016.
- Route /projects/[id]?tab=tasks; confirmed current base5987804. PR10 persistence, PR13 Goals and PR21 movement preserved; unrelated PRs untouched.

## STATUS
- Approval/claim handlers previously changed the card before saving and restored an entire old list on error, which could erase another task's confirmed edits.
- Small behavior-only slice: wait for server confirmation, update the affected task only, catch rejected promises, share the per-task operation guard with moves and release it after all outcomes. Preserve owner checks, warnings and success-only activity refresh.
- No JSX/style/layout/assets changes; not visual redesign. No schema, permissions, RLS, credentials, budget or server-action contract changes. Specialist orchestrator classified the visual approval gate as not applicable to this behavior-only slice.

## FILES
- engines/project/components/workspace/tasks-tab.tsx
- engines/project/__tests__/task-approval-claim-sync.test.ts
- ESTADO.md and this handoff.

## VALIDATION
- Focused lint PASS; focused23/23 PASS (15new+8movement); TypeScript PASS; full183 PASS/8 credential-dependent SKIP; production build Next16.2.10 PASS (9static pages); diff check PASS. Existing metadataBase warning only. Specialist release/testing GO. Final PR/CI/deployment in central task belong-task-approval-claim-sync-20261016.
- Actual-handler harness tests do not prove browser rendering, real Supabase persistence, RLS or cross-session claim assignment locking.
- No authorized BELONG test account/project configured for the real authenticated acceptance; do not count credential-dependent skips as successful integration tests.

## CURRENT PROBLEM
- Authenticated acceptance still needs an authorized project/account; server claim concurrency and broader refreshed-state ordering are outside this slice.

## NEXT ACTION
- In an authorized project, reject approval/claim while another task changes, then retry successfully: only the saved task changes and unrelated edits remain after reload.

## DO NOT TOUCH
- Environment, credentials, Supabase/Vercel configuration, migrations, unrelated modules and existing assets.

## REFERENCE / GIT
- Existing UI composition preserved, no new visual direction. Preparation and exact final PR/integrated/deployed/verified evidence: central task and linked PR.
- Lease scope target_repository_implementation, codex-workmode; no competing active BELONG lease at claim.

## CONTENT
- Retain recent equivalent BELONG goals/community image produced2026-10-13: exec-c305f33d-980a-4667-8bbd-de4ffdb0e19c.png. Decision2026-10-16: no duplicate generated. Original QA/production recorded in Oct13 brain; scratch bytes may have been pruned, not claimed locally present.
- Objective: real projects, goals and constructive collaboration. Produced/ready to share here; NOT externally published by this run.
- Caption: Una meta clara ayuda a dar el siguiente paso. En BELONG, organiza proyectos y metas con tu comunidad. Empieza aquí: https://belong-ruddy.vercel.app
