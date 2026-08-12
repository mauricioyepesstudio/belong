---
name: belong-product-engineering
description: Build, debug, review, or redesign the BELONG Next.js product while preserving its domain model, engines, data flows, permissions, design system, accessibility, performance, and existing functionality. Use for any BELONG repository work involving authenticated Home/Dashboard, communities, projects, missions, opportunities, impact, organizations, events, Realtime, navigation, UI, testing, or architecture.
---

# BELONG Product Engineering

## Start with evidence

1. Read repository `AGENTS.md` and the relevant Next.js 16 guide under `node_modules/next/dist/docs/` before editing Next.js code.
2. Inspect the route entry, exports, final screen component, data loader, actions, and permission checks involved in the requested flow.
3. Run `git status --short` before editing. Preserve unrelated local changes and untracked migrations.
4. Read only the relevant repository sources listed in [references/repository-map.md](references/repository-map.md).

## Preserve the product model

- Treat people, communities, projects, missions, opportunities, events, resources, organizations, and impact as connected BELONG domains.
- Reuse existing engines, server actions, data loaders, types, navigation, analytics, Realtime, and design-system primitives.
- Do not create duplicate data sources, mock production data, parallel permission systems, or UI-only state that contradicts server state.
- Respect domain prerequisites. Communicate them before an action; never let a button promise an operation the server will reject for an undisclosed prerequisite.
- Keep user-facing language purposeful, human, and specific. Replace raw event names and database terminology with meaningful copy.

## Build the experience

- Keep the authenticated Home centered on the user's world, purpose, relationships, active work, opportunities, and measurable impact.
- Prefer progressive disclosure over long dashboards. Avoid repeated modules and competing summaries.
- Preserve keyboard access, semantic headings, focus visibility, readable contrast, reduced-motion behavior, responsive layouts, and useful empty states.
- Use motion to explain relationships or state. Keep animation transform/opacity based where possible and disable nonessential motion under `prefers-reduced-motion`.
- Reuse live BELONG data. Every count, recommendation, activity, mission, project, and impact signal must trace to an existing loader or engine.

## Implement safely

1. Make the smallest coherent change at the real rendering boundary.
2. Keep client state synchronized with server truth after mutations and Realtime events.
3. Guard Realtime lifecycles against stale callbacks, duplicate subscriptions, navigation, and React remounts.
4. Keep authorization in server actions even when the UI hides unavailable controls.
5. Update analytics only through the existing analytics system.
6. Do not alter migrations unless the requested feature requires a reviewed schema change.

## Validate proportionally

1. Run focused ESLint on modified files.
2. Run focused tests for affected engines/actions; distinguish new failures from documented pre-existing failures.
3. Run TypeScript/build checks when practical. Report environmental blockers such as network font downloads separately from code failures.
4. Test the real authenticated flow locally, including success, prerequisite, empty, loading, error, mobile, keyboard, and reduced-motion states.
5. Inspect the rendered UI rather than relying only on compilation.
6. Run `git diff --check`, review the diff, and confirm unrelated files remain untouched.

## Commit discipline

- Create small commits grouped by user-visible feature, stability fix, or permission correction.
- Never stage unrelated migrations or user changes.
- State the verified route, files changed, checks run, known pre-existing failures, and exact local test flow in the handoff.
