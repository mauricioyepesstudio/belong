# BELONG — project progress error propagation

Date: 2026-10-08

## Objective

Keep project work honest when a task crosses the `done` boundary. The task mutation and the derived `projects.progress` synchronization are separate database operations; BELONG must not return silent success when the aggregate count or progress write fails.

## Prepared change

- Inspect both task-count query results before calculating progress.
- Skip the aggregate write when either count fails.
- Report a precise partial-success warning when the task persisted but aggregate progress could not be recalculated or updated.
- Revalidate the affected project so the persisted task truth can be rendered.
- Preserve existing authorization, completion activity, impact and notification behavior.

No schema, migration, RLS, permission, secret, billing, visual or analytics change.

## Evidence

- Focused Vitest: 13 passed.
- Full Vitest: 133 passed; 8 credential-dependent Supabase integration tests skipped.
- Targeted ESLint: passed.
- TypeScript: passed.
- Production build: passed.
- `git diff --check`: passed.

## Limit

This improves error truth but does not make the two database writes transactional. An authenticated production account is still required to verify the real task transition and aggregate refresh against Supabase. Do not claim that journey verified from mocked tests.

## Content

The recent BELONG visual from 2026-10-06 remains equivalent: `exec-db456e0b-0ad2-46c0-8077-9cc71cfdd15f.png`. It is produced and ready to share here, not published externally. No duplicate was generated.

## Next objective

With an authorized test account, exercise both `review → done` and `done → review`, reload the project, and confirm task status and aggregate progress persist together. If a real failure exposes another optimistic-state mismatch, handle it in a separate bounded slice.
