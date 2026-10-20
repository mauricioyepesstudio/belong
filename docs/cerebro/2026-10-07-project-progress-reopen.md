# BELONG — project progress after reopening work

Date: 2026-10-07

## Objective

Keep project progress derived from persisted task state. A completed task moved back to review, in progress, or todo must reduce `projects.progress`; completion activity and impact remain exclusive to a transition into `done`.

## Change

- Recalculate project progress whenever a task transition crosses the `done` boundary in either direction.
- Preserve the existing owner-only approval prerequisite for entering `done`.
- Preserve completion activity, impact, and contributor notification only for the forward transition into `done`.
- No schema, migration, permission, environment, billing, asset, or visible UI changes.

## Evidence

- Base branch: `2026-07-16-gbly`.
- Base commit and production baseline: `1d8563cf3d81f17657db886b2e771906a68b5da1`.
- Focused persistence tests: 10 passed.
- Full Vitest: 130 passed; 8 credential-dependent integration tests skipped.
- Targeted ESLint: passed.
- TypeScript: passed.
- Production build: passed.
- `git diff --check`: passed.

## State

Prepared. Not yet integrated, deployed, or verified with an authenticated production account.

Production before this change is Vercel deployment `dpl_EoiPEPTu5MPDurtiXgzURg2KdgwW`, READY at commit `1d8563cf3d81f17657db886b2e771906a68b5da1`.

## Limits and next objective

The authenticated project task journey was not exercised because no test account was available. After required checks and review, integrate the PR, verify the resulting production commit, then test moving a completed task back to review and confirm that project progress decreases.

## Content

The BELONG visual produced on 2026-10-06 (`exec-db456e0b-0ad2-46c0-8077-9cc71cfdd15f.png`) remains a recent equivalent. Status: produced and ready to share here; not published externally. No duplicate was generated.
