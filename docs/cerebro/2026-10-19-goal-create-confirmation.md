# Goal creation confirmation — 2026-10-19

Base: 69e4d8f25a7a76dc88d380f67f03447bdadf27a9. PR10 persistence and PR13 progress rollback are already merged. Scope: client handler and regression tests, with no JSX/style, server, schema, permissions or credentials changes.

## Reproduction and behavior

On `/projects/[id]`, Goals, reject `createProjectGoal`. Previously the rejection escaped. The handler now preserves the draft and reports `Goal creation could not be confirmed. Refresh before trying again.` A synchronous ref lock suppresses a second pending create request and releases in finally. Returned action errors retain their existing toast. Confirmed `{}` success retains the existing success toast, draft clearing and reload; the action does not return a goal ID.

An insertion may persist before revalidation throws. The warning does not claim nothing was saved; refresh before retrying. This guard is not cross-session idempotence. Focused ESLint and 18 handler tests pass; full suite: 209 passed, 8 credential-dependent integration tests skipped. TypeScript passes. Independent scope and release review: GO. Build, exact-head CI and release evidence are recorded in central task `belong-goal-create-confirmation-20261019` at handoff.

## Verification limits and next action

Mocked handler tests do not establish real authentication, Supabase RLS or an authenticated production journey. An authorized BELONG test account and project remain unavailable. Next: verify confirmed creation, returned error, uncertain response and refresh in that authorized project. Do not touch environment files, credentials, Supabase/Vercel configuration or unrelated modules.

## Content decision

2026-10-19: retained the recent equivalent visual produced and QA-reviewed on 2026-10-18: `exec-22619d8a-fd46-4f30-ae64-3468f78a19f7.png`. Objective: projects, goals and community through a clear next step. Actual palette: #030014, #8b5cf6, #a78bfa, #6366f1. Caption/CTA: Un proyecto empieza con una idea y un siguiente paso claro. En BELONG, organiza tus proyectos y metas junto a tu comunidad. Empieza aquí: https://belong-ruddy.vercel.app

State: produced, ready to share here; not scheduled or published externally. No channel authorization, provider receipt or post permalink was verified. No duplicate generated today. Original production/text QA evidence: `docs/cerebro/2026-10-18-goal-progress-rejection.md`.
