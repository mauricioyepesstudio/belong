# Goal creation persistence — 2026-10-20

## Project and scope

Isolated checkout `belong-isolated-20261020`, branch `codex/belong-goal-create-persistence-20261020`, base `75e6ca6a5a40b68dfafcd014dffc8e80e9c7f168`. Route: `/projects/[id]`, Goals. PR10 persistence and PR13 progress correction are already merged; yesterday's client draft and duplicate guards remain intact.

`createProjectGoal` previously accepted an insert with no returned representation. It now selects only the inserted `id` and requires a confirmed row before revalidation and the existing `{}` success response. Database errors or missing confirmation return an error. Missing confirmation says refresh before retrying: an uncertain response does not establish that no insert happened. No new impact events or notifications.

Trace: route → `getProjectDetail` → `fetchProjectDetail` → workspace/goals loader → `ProjectDetailScreen` → `ProjectGoalsTab` → server action → `requireProfile` and project membership. Repository SELECT/ALL policies already allow project members to read goals; this slice changes no policies, grants or schema. Actual live RLS acceptance remains unverified.

## Validation and handoff

Focused action regressions cover confirmed creation, returned error, missing row, membership prerequisite, blank title and existing normalization/defaults. Focused ESLint and 25 tests PASS, including seven new server cases and existing client create/progress cases. Independent testing/release GO: TypeScript, full suite222 PASS/8 credential-dependent SKIP, production build and diff PASS. Final exact-head CI, PR and deployed SHA evidence are recorded in central task `belong-goal-create-persistence-20261020`.

No JSX, styling, assets, credentials, configuration, migrations, billing or budget changes. Existing inactive demo-profile tooling is preserved and not enabled. Other agents' PRs are untouched. No real account or database writes in this delivery.

Current acceptance limit: an authorized BELONG test account and project are unavailable. Mocked action tests do not establish a browser save/reload journey or real Supabase RLS behavior. Next action: verify goal creation and missing-confirmation handling plus refresh in that authorized project. Do not use another project's database.

## Content decision

2026-10-20: retain recent equivalent creative produced and QA-reviewed on 2026-10-18, `exec-22619d8a-fd46-4f30-ae64-3468f78a19f7.png`. Objective: projects, goals and community with a clear next step. Real palette: #030014, #8b5cf6, #a78bfa, #6366f1. Original evidence: `docs/cerebro/2026-10-18-goal-progress-rejection.md`. No duplicate generated or claim of current local bytes.

Caption/CTA: Un proyecto empieza con una idea y un siguiente paso claro. En BELONG, organiza tus proyectos y metas junto a tu comunidad. Empieza aquí: https://belong-ruddy.vercel.app

State: produced, ready to share here; not scheduled or externally published. Channel/account authorization and provider publication receipt remain unverified. No invented metrics, testimonials, logos or screenshots.
